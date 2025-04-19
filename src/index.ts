// web-totp.ts
const decoder = new TextDecoder();
const encoder = new TextEncoder();

// Define supported algorithms
export type TOTPAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface TOTPOptions {
  secret?: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
  window?: number;
  charSet?: string;
}

function toUint8Array(str: string) {
  const cleaned = str.replace(/[^A-Z2-7]/gi, "").toUpperCase();
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes: number[] = [];
  let bits = 0,
    value = 0,
    index = 0;

  for (let i = 0; i < cleaned.length; i++) {
    value = (value << 5) | base32Chars.indexOf(cleaned[i]);
    bits += 5;
    if (bits >= 8) {
      bytes[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

function intToBytes(num: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, num, false); // write at offset 4 for 64-bit
  return new Uint8Array(buf);
}

function generateRandomSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += base32Chars[bytes[i] % 32];
  }
  return secret;
}

async function generateHOTP(
  secret: string, 
  counter: number, 
  algorithm: TOTPAlgorithm = 'SHA-1',
  digits: number = 6,
  charSet: string = '0123456789'
): Promise<string> {
  const keyData = toUint8Array(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );

  const counterBytes = intToBytes(counter);
  const signature = await crypto.subtle.sign("HMAC", key, counterBytes);
  const hash = new Uint8Array(signature);

  // Use custom character set if provided
  if (charSet !== '0123456789') {
    const charSetLength = charSet.length;
    let result = '';
    
    // Use multiple bytes from the hash to generate each character
    // This makes the output more random and unpredictable
    for (let i = 0; i < digits; i++) {
      // Use 4 bytes for each character to get more entropy
      const value = (
        (hash[i * 4 % hash.length] << 24) |
        (hash[(i * 4 + 1) % hash.length] << 16) |
        (hash[(i * 4 + 2) % hash.length] << 8) |
        hash[(i * 4 + 3) % hash.length]
      ) >>> 0; // Convert to unsigned 32-bit integer
      
      result += charSet[value % charSetLength];
    }
    
    return result;
  }
  
  // For numeric tokens, use the standard HOTP truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  return (code % 10 ** digits).toString().padStart(digits, "0");
}

export interface TOTPResult {
  token: string;
  secret: string;
  remainingSeconds: number;
}

export async function generateTOTP(options: TOTPOptions = {}): Promise<TOTPResult> {
  const secret = options.secret || generateRandomSecret();
  const window = options.window || 0;
  const algorithm = options.algorithm || 'SHA-1';
  const digits = options.digits || 6;
  const charSet = options.charSet || '0123456789';
  const period = options.period || 30;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / period) + window;
  const token = await generateHOTP(secret, counter, algorithm, digits, charSet);
  const remainingSeconds = period - (currentTime % period);

  return {
    token,
    secret,
    remainingSeconds,
  };
}

export async function verifyTOTP(
  token: string,
  options: { 
    secret: string; 
    window?: number;
    algorithm?: TOTPAlgorithm;
    digits?: number;
    charSet?: string;
    period?: number;
  },
): Promise<boolean> {
  const { 
    secret, 
    window = 1,
    algorithm = 'SHA-1',
    digits = 6,
    charSet = '0123456789',
    period = 30
  } = options;
  
  const current = Math.floor(Date.now() / 1000 / period);
  
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const expected = await generateHOTP(secret, current + errorWindow, algorithm, digits, charSet);
    if (expected === token) return true;
  }
  return false;
}

export function getTOTPAuthUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
  algorithm?: TOTPAlgorithm;
  digits?: number;
  period?: number;
}): string {
  const { secret, accountName, issuer, algorithm, digits, period } = options;
  const params = new URLSearchParams({
    secret,
    ...(issuer ? { issuer } : {}),
    ...(algorithm ? { algorithm: algorithm.toLowerCase() } : {}),
    ...(digits ? { digits: digits.toString() } : {}),
    ...(period ? { period: period.toString() } : {}),
  });
  const label = issuer ? `${issuer}:${accountName}` : accountName;
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    let attempt = this.attempts.get(key);

    if (!attempt) {
      attempt = { count: 1, timestamp: now };
      this.attempts.set(key, attempt);
      return false;
    }

    // Reset if window has passed
    if (now - attempt.timestamp > this.windowMs) {
      attempt.count = 1;
      attempt.timestamp = now;
      return false;
    }

    // Check if already at or over limit
    if (attempt.count >= this.maxAttempts) {
      return true;
    }

    // Increment attempt count
    attempt.count++;
    return false;
  }

  reset(key: string): void {
    this.attempts.set(key, { count: 0, timestamp: Date.now() });
  }

  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return this.maxAttempts;
    
    const now = Date.now();
    if (now - attempt.timestamp > this.windowMs) {
      return this.maxAttempts;
    }
    
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const now = Date.now();
    const timeElapsed = now - attempt.timestamp;
    
    if (timeElapsed > this.windowMs) {
      return 0;
    }
    
    return this.windowMs - timeElapsed;
  }
}
