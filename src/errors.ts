export class TOTPError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TOTPError';
  }
}

export const ErrorCodes = {
  INVALID_SECRET: 'INVALID_SECRET',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_ALGORITHM: 'INVALID_ALGORITHM',
  INVALID_PERIOD: 'INVALID_PERIOD',
  INVALID_DIGITS: 'INVALID_DIGITS',
  CRYPTO_NOT_SUPPORTED: 'CRYPTO_NOT_SUPPORTED',
} as const; 