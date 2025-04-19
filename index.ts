// web-totp.ts
const decoder = new TextDecoder();
const encoder = new TextEncoder();

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

async function generateHOTP(secret: string, counter: number): Promise<string> {
  const keyData = toUint8Array(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const counterBytes = intToBytes(counter);
  const signature = await crypto.subtle.sign("HMAC", key, counterBytes);
  const hash = new Uint8Array(signature);

  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (code % 10 ** 6).toString().padStart(6, "0");
}

interface TOTPOptions {
  secret?: string;
  window?: number;
}

interface TOTPResult {
  token: string;
  secret: string;
  remainingSeconds: number;
}

export async function generateTOTP(options: TOTPOptions = {}): Promise<TOTPResult> {
  const secret = options.secret || generateRandomSecret();
  const window = options.window || 0;
  const currentTime = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / 30) + window;
  const token = await generateHOTP(secret, counter);
  const remainingSeconds = 30 - (currentTime % 30);

  return {
    token,
    secret,
    remainingSeconds,
  };
}

export async function verifyTOTP(
  token: string,
  options: { secret: string; window?: number },
): Promise<boolean> {
  const { secret, window = 1 } = options;
  const current = Math.floor(Date.now() / 1000 / 30);
  
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const expected = await generateHOTP(secret, current + errorWindow);
    if (expected === token) return true;
  }
  return false;
}

export function getTOTPAuthUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const { secret, accountName, issuer } = options;
  const params = new URLSearchParams({
    secret,
    ...(issuer ? { issuer } : {}),
  });
  const label = issuer ? `${issuer}:${accountName}` : accountName;
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
