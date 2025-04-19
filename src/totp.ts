import { TOTPError, ErrorCodes } from './errors';

export interface TOTPOptions {
  secret?: string;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
  digits?: number;
  period?: number;
  window?: number;
}

export interface TOTPResult {
  token: string;
  secret: string;
  remainingSeconds: number;
}

export interface TOTPAuthUriOptions {
  secret: string;
  accountName: string;
  issuer?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
}

const DEFAULT_OPTIONS: Required<TOTPOptions> = {
  secret: '',
  algorithm: 'SHA-1',
  digits: 6,
  period: 30,
  window: 1,
};

function base32ToBytes(base32: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = base32.split('').reduce((acc, char) => {
    const value = base32Chars.indexOf(char.toUpperCase());
    if (value === -1) {
      throw new TOTPError('Invalid base32 character', ErrorCodes.INVALID_SECRET);
    }
    return acc + value.toString(2).padStart(5, '0');
  }, '');

  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i += 8) {
    bytes[i / 8] = parseInt(bits.slice(i, i + 8), 2);
  }
  return bytes;
}

function bytesToBase32(bytes: Uint8Array): string {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }
  
  let base32 = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (chunk.length === 5) {
      base32 += base32Chars[parseInt(chunk, 2)];
    }
  }
  return base32;
}

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function generateTOTP(options: TOTPOptions = {}): Promise<TOTPResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!opts.secret) {
    opts.secret = bytesToBase32(generateRandomBytes(20));
  }

  try {
    const secretBytes = base32ToBytes(opts.secret);
    const counter = Math.floor(Date.now() / 1000 / opts.period);
    const counterBytes = new Uint8Array(8);
    const view = new DataView(counterBytes.buffer);
    view.setBigInt64(0, BigInt(counter), false);

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: opts.algorithm },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      counterBytes
    );

    const hash = new Uint8Array(signature);
    const offset = hash[hash.length - 1] & 0xf;
    const binary = ((hash[offset] & 0x7f) << 24) |
                  ((hash[offset + 1] & 0xff) << 16) |
                  ((hash[offset + 2] & 0xff) << 8) |
                  (hash[offset + 3] & 0xff);

    const token = (binary % Math.pow(10, opts.digits)).toString().padStart(opts.digits, '0');
    const remainingSeconds = opts.period - (Math.floor(Date.now() / 1000) % opts.period);

    return {
      token,
      secret: opts.secret,
      remainingSeconds,
    };
  } catch (error) {
    if (error instanceof TOTPError) throw error;
    throw new TOTPError(
      'Failed to generate TOTP',
      ErrorCodes.CRYPTO_NOT_SUPPORTED
    );
  }
}

export async function verifyTOTP(token: string, options: TOTPOptions): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!opts.secret) {
    throw new TOTPError('Secret is required', ErrorCodes.INVALID_SECRET);
  }

  if (!/^\d+$/.test(token)) {
    throw new TOTPError('Invalid token format', ErrorCodes.INVALID_TOKEN);
  }

  if (token.length !== opts.digits) {
    throw new TOTPError('Invalid token length', ErrorCodes.INVALID_TOKEN);
  }

  try {
    for (let i = -opts.window; i <= opts.window; i++) {
      const testOptions = { ...opts, period: opts.period };
      const result = await generateTOTP(testOptions);
      if (result.token === token) {
        return true;
      }
    }
    return false;
  } catch (error) {
    if (error instanceof TOTPError) throw error;
    throw new TOTPError(
      'Failed to verify TOTP',
      ErrorCodes.CRYPTO_NOT_SUPPORTED
    );
  }
}

export function getTOTPAuthUri(options: TOTPAuthUriOptions): string {
  const {
    secret,
    accountName,
    issuer = 'TOTP Web',
    algorithm = 'SHA1',
    digits = 6,
    period = 30,
  } = options;

  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccountName = encodeURIComponent(accountName);

  return `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
} 