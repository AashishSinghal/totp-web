# totp-web

A lightweight, secure TOTP (Time-based One-Time Password) implementation for web browsers using the Web Crypto API. This package provides a simple way to generate and verify TOTP tokens for two-factor authentication (2FA) in web applications.

## Features

- 🔒 Secure implementation using Web Crypto API
- 🌐 Works in all modern browsers
- 🪶 Zero dependencies
- 📦 TypeScript support out of the box
- ⚡ Supports both ESM and CommonJS

## Installation

```bash
npm install totp-web
# or
yarn add totp-web
# or
pnpm add totp-web
```

## Usage

```typescript
import { generateTOTP, verifyTOTP } from 'totp-web';

// Generate a TOTP token
const secret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded secret
const token = await generateTOTP(secret);
console.log('Current TOTP:', token); // e.g., "123456"

// Verify a TOTP token
const isValid = await verifyTOTP(secret, token);
console.log('Token is valid:', isValid); // true

// Verify with custom window (default is 1)
// This allows for time skew of ±{window} 30-second periods
const isValidWithWindow = await verifyTOTP(secret, token, 2);
```

## API Reference

### generateTOTP(secret: string, window: number = 0): Promise<string>

Generates a TOTP token for the given secret.

- `secret`: Base32 encoded secret key
- `window`: Optional time window offset (default: 0)
- Returns: Promise resolving to a 6-digit TOTP token

### verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean>

Verifies a TOTP token against a secret.

- `secret`: Base32 encoded secret key
- `token`: The TOTP token to verify
- `window`: Optional time window for validation (default: 1, meaning ±30 seconds)
- Returns: Promise resolving to boolean indicating if the token is valid

## Security Considerations

- The secret key should be securely stored and transmitted
- This implementation uses SHA-1 HMAC as specified in RFC 6238
- The default window of ±30 seconds allows for clock skew
- Uses the Web Crypto API for secure cryptographic operations

## License

MIT License - see the [LICENSE](LICENSE) file for details 