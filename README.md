# totp-web

<div align="center">
  <img src="https://img.shields.io/npm/v/totp-web.svg" alt="npm version" />
  <img src="https://img.shields.io/npm/l/totp-web.svg" alt="license" />
  <img src="https://img.shields.io/npm/dm/totp-web.svg" alt="downloads" />
  <img src="https://img.shields.io/bundlephobia/min/totp-web.svg" alt="bundle size" />
</div>

<br />

<div align="center">
  <h3>A lightweight, secure TOTP (Time-based One-Time Password) implementation for web browsers</h3>
  <p>Generate and verify TOTP tokens for two-factor authentication (2FA) in web applications using the Web Crypto API</p>
</div>

<br />

<div align="center">
  <a href="#features">Features</a> •
  <a href="#motivation">Motivation</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#security">Security</a> •
  <a href="#license">License</a>
</div>

<br />

## Features

- 🔒 **Secure Implementation**: Uses the Web Crypto API for cryptographic operations
- 🌐 **Browser Compatible**: Works in all modern browsers without polyfills
- 🪶 **Zero Dependencies**: Lightweight with no external dependencies
- 📦 **TypeScript Support**: Full type definitions out of the box
- ⚡ **Module Support**: Compatible with both ESM and CommonJS
- 🔄 **Real-time Updates**: Generate tokens that update every 30 seconds
- 📱 **QR Code Support**: Generate QR codes for easy setup with authenticator apps
- 🧪 **Verification**: Verify tokens with configurable time windows for clock skew
- 🔐 **Multiple Algorithms**: Support for SHA-1, SHA-256, and SHA-512
- 🎨 **Custom Character Sets**: Generate tokens with custom character sets
- 🛡️ **Rate Limiting**: Built-in rate limiting utility to prevent brute force attacks

## Motivation

Two-factor authentication (2FA) has become a standard security practice for protecting user accounts. While many services offer 2FA, implementing it in web applications has traditionally required server-side components or complex client-side libraries with dependencies.

**totp-web** was created to address these challenges:

1. **Client-Side Only**: Enable 2FA functionality without requiring server-side token generation
2. **Simplicity**: Provide a straightforward API for generating and verifying TOTP tokens
3. **Security**: Leverage the Web Crypto API for secure cryptographic operations
4. **Performance**: Keep the library lightweight with zero dependencies
5. **Accessibility**: Make 2FA implementation accessible to developers of all skill levels

This package is particularly useful for:
- Progressive Web Apps (PWAs) that need offline 2FA capabilities
- Single Page Applications (SPAs) that want to reduce server load
- Applications that need to implement 2FA without backend changes
- Developers who want to understand how TOTP works through a clean implementation

## Installation

```bash
# Using npm
npm install totp-web

# Using yarn
yarn add totp-web

# Using pnpm
pnpm add totp-web
```

## Usage

### Basic Token Generation

```typescript
import { generateTOTP } from 'totp-web';

// Generate a TOTP token for a secret
const secret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded secret
const result = await generateTOTP({ secret });

console.log('Current TOTP:', result.token); // e.g., "123456"
console.log('Seconds until next token:', result.remainingSeconds); // e.g., 15
```

### Advanced Token Generation

```typescript
import { generateTOTP } from 'totp-web';

// Generate a TOTP token with custom options
const result = await generateTOTP({
  secret: 'JBSWY3DPEHPK3PXP',
  algorithm: 'SHA-256', // Use SHA-256 instead of default SHA-1
  digits: 8, // Generate 8-digit token instead of default 6
  charSet: '0123456789ABCDEF', // Use hexadecimal characters
  period: 60, // Use 60-second period instead of default 30
  window: 1 // Allow for 1 period of clock skew
});

console.log('Current TOTP:', result.token); // e.g., "1A2B3C4D"
console.log('Seconds until next token:', result.remainingSeconds); // e.g., 45
```

### Token Verification

```typescript
import { verifyTOTP } from 'totp-web';

// Verify a TOTP token
const secret = 'JBSWY3DPEHPK3PXP';
const token = '123456';
const isValid = await verifyTOTP(token, { secret });

console.log('Token is valid:', isValid); // true or false

// Verify with custom window (default is 1)
// This allows for time skew of ±{window} 30-second periods
const isValidWithWindow = await verifyTOTP(token, { secret, window: 2 });

// Verify with custom options
const isValidWithOptions = await verifyTOTP(token, { 
  secret, 
  algorithm: 'SHA-256',
  digits: 8,
  charSet: '0123456789ABCDEF',
  period: 60
});
```

### Generating QR Codes for Authenticator Apps

```typescript
import { getTOTPAuthUri } from 'totp-web';

// Generate a URI for QR code generation
const secret = 'JBSWY3DPEHPK3PXP';
const uri = getTOTPAuthUri({
  secret,
  accountName: 'user@example.com',
  issuer: 'MyApp',
  algorithm: 'SHA-256',
  digits: 8,
  period: 60
});

// Use this URI with any QR code library
// For example, with qrcode.react:
import { QRCodeSVG } from 'qrcode.react';

function QRCodeComponent() {
  return <QRCodeSVG value={uri} size={200} />;
}
```

### Rate Limiting

```typescript
import { RateLimiter } from 'totp-web';

// Create a rate limiter with 5 attempts per minute
const limiter = new RateLimiter(5, 60000);

// Check if a user is rate limited
function verifyUserInput(userId: string, token: string) {
  if (limiter.isRateLimited(userId)) {
    const remainingTime = limiter.getTimeUntilReset(userId);
    return {
      success: false,
      message: `Too many attempts. Please try again in ${Math.ceil(remainingTime / 1000)} seconds.`
    };
  }
  
  // Proceed with token verification
  // ...
  
  // Reset rate limiter on successful verification
  limiter.reset(userId);
  
  return { success: true };
}

// Get remaining attempts
function getRemainingAttempts(userId: string) {
  return limiter.getRemainingAttempts(userId);
}
```

### Complete Example with React

```tsx
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateTOTP, verifyTOTP, getTOTPAuthUri, RateLimiter } from 'totp-web';

function TOTPComponent() {
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [qrUri, setQrUri] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [error, setError] = useState('');
  
  // Create a rate limiter
  const limiter = new RateLimiter(5, 60000); // 5 attempts per minute

  useEffect(() => {
    // Generate a new secret when component mounts
    const generateNewSecret = async () => {
      const result = await generateTOTP({
        algorithm: 'SHA-256',
        digits: 8
      });
      setSecret(result.secret);
      setRemainingSeconds(result.remainingSeconds);
      
      // Generate QR code URI
      setQrUri(getTOTPAuthUri({
        secret: result.secret,
        accountName: 'user@example.com',
        issuer: 'MyApp',
        algorithm: 'SHA-256',
        digits: 8
      }));
    };

    generateNewSecret();
  }, []);

  // Update token every second
  useEffect(() => {
    const updateToken = async () => {
      if (!secret) return;
      const result = await generateTOTP({ 
        secret,
        algorithm: 'SHA-256',
        digits: 8
      });
      setToken(result.token);
      setRemainingSeconds(result.remainingSeconds);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const handleVerify = async () => {
    if (!secret || !verificationToken) return;
    
    // Check rate limiting
    if (limiter.isRateLimited('user')) {
      const remainingTime = limiter.getTimeUntilReset('user');
      setError(`Too many attempts. Please try again in ${Math.ceil(remainingTime / 1000)} seconds.`);
      return;
    }
    
    try {
      const result = await verifyTOTP(verificationToken, { 
        secret,
        algorithm: 'SHA-256',
        digits: 8
      });
      setIsValid(result);
      
      // Reset rate limiter on successful verification
      if (result) {
        limiter.reset('user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div>
      <h2>Your Secret</h2>
      <code>{secret}</code>
      
      <h2>QR Code</h2>
      {qrUri && <QRCodeSVG value={qrUri} size={200} />}
      
      <h2>Current Token</h2>
      <div>
        <code>{token}</code>
        <div>Expires in {remainingSeconds} seconds</div>
      </div>
      
      <h2>Verify Token</h2>
      <input
        type="text"
        value={verificationToken}
        onChange={(e) => setVerificationToken(e.target.value)}
        placeholder="Enter token to verify"
      />
      <button onClick={handleVerify}>Verify</button>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {isValid !== null && !error && (
        <div style={{ color: isValid ? 'green' : 'red' }}>
          {isValid ? 'Token is valid!' : 'Token is invalid!'}
        </div>
      )}
      
      <div>
        Remaining attempts: {limiter.getRemainingAttempts('user')}
      </div>
    </div>
  );
}
```

## API Reference

### generateTOTP(options: TOTPOptions): Promise<TOTPResult>

Generates a TOTP token and related information.

#### TOTPOptions
- `secret?: string`: Optional Base32 encoded secret key. If not provided, a new secret will be generated.
- `algorithm?: TOTPAlgorithm`: Hash algorithm to use (default: 'SHA-1'). Options: 'SHA-1', 'SHA-256', 'SHA-512'.
- `digits?: number`: Number of digits in the token (default: 6).
- `charSet?: string`: Custom character set for token generation (default: '0123456789').
- `period?: number`: Time period in seconds (default: 30).
- `window?: number`: Time window for validation (default: 0).

#### TOTPResult
- `token`: The TOTP token
- `secret`: The secret used to generate the token
- `remainingSeconds`: Seconds until the token expires

### verifyTOTP(token: string, options: TOTPVerifyOptions): Promise<boolean>

Verifies a TOTP token against a secret.

#### TOTPVerifyOptions
- `secret`: Base32 encoded secret key
- `algorithm?: TOTPAlgorithm`: Hash algorithm to use (default: 'SHA-1')
- `digits?: number`: Number of digits in the token (default: 6)
- `charSet?: string`: Custom character set for token generation (default: '0123456789')
- `period?: number`: Time period in seconds (default: 30)
- `window?: number`: Time window for validation (default: 1, meaning ±30 seconds)

### getTOTPAuthUri(options: TOTPAuthUriOptions): string

Generates a URI for QR code generation compatible with authenticator apps.

#### TOTPAuthUriOptions
- `secret`: Base32 encoded secret key
- `accountName`: The account name to display in the authenticator app
- `issuer?: string`: Optional issuer name to display in the authenticator app
- `algorithm?: TOTPAlgorithm`: Hash algorithm to use (default: 'SHA-1')
- `digits?: number`: Number of digits in the token (default: 6)
- `period?: number`: Time period in seconds (default: 30)

### RateLimiter

A utility class for implementing rate limiting to prevent brute force attacks.

#### Constructor
- `new RateLimiter(maxAttempts: number = 5, windowMs: number = 60000)`
  - `maxAttempts`: Maximum number of attempts allowed within the time window (default: 5)
  - `windowMs`: Time window in milliseconds (default: 60000, which is 1 minute)

#### Methods
- `isRateLimited(key: string): boolean`: Check if a key is rate limited
- `reset(key: string): void`: Reset the rate limit for a key
- `getRemainingAttempts(key: string): number`: Get the number of remaining attempts for a key
- `getTimeUntilReset(key: string): number`: Get the time in milliseconds until the rate limit resets for a key

## Development Utilities

The package includes several development utilities to help with common TOTP operations:

```typescript
import { TOTPUtils } from 'totp-web';

// Generate a random secret key
const secret = TOTPUtils.generateSecret();

// Generate backup codes for account recovery
const backupCodes = TOTPUtils.generateBackupCodes(8, 8);

// Test TOTP configuration
const isValid = await TOTPUtils.testConfiguration({
  algorithm: 'SHA-256',
  digits: 6,
  period: 30
});

// Format time remaining
const timeRemaining = TOTPUtils.formatTimeRemaining(29); // "29s"

// Validate configuration
const validation = TOTPUtils.validateConfiguration({
  algorithm: 'SHA-256',
  digits: 6,
  period: 30
});
```

## CLI Tool

The package includes a command-line interface for testing and debugging TOTP tokens:

```bash
# Install globally
npm install -g totp-web

# Generate a new TOTP token
totp-web generate
totp-web generate --algorithm SHA-256 --digits 8

# Verify a TOTP token
totp-web verify ABC123 --secret JBSWY3DPEHPK3PXP

# Generate a TOTP auth URI
totp-web uri --secret JBSWY3DPEHPK3PXP --accountName user@example.com --issuer Example
```

### CLI Options

#### Generate Command
- `--secret <secret>`: Secret key (optional, will generate if not provided)
- `--algorithm <algo>`: Algorithm (SHA-1, SHA-256, SHA-512)
- `--digits <number>`: Number of digits (default: 6)
- `--period <seconds>`: Period in seconds (default: 30)
- `--charSet <chars>`: Custom character set

#### Verify Command
- `--secret <secret>`: Secret key (required)
- `--algorithm <algo>`: Algorithm (SHA-1, SHA-256, SHA-512)
- `--digits <number>`: Number of digits (default: 6)
- `--period <seconds>`: Period in seconds (default: 30)
- `--charSet <chars>`: Custom character set
- `--window <number>`: Time window for verification (default: 1)

#### URI Command
- `--secret <secret>`: Secret key (required)
- `--accountName <name>`: Account name (required)
- `--issuer <name>`: Issuer name (optional)
- `--algorithm <algo>`: Algorithm (SHA-1, SHA-256, SHA-512)
- `--digits <number>`: Number of digits (default: 6)
- `--period <seconds>`: Period in seconds (default: 30)

## Examples

### Setting Up 2FA for a User

```typescript
import { generateTOTP, getTOTPAuthUri } from 'totp-web';

// Generate a new secret for a user
const { secret } = await generateTOTP({
  algorithm: 'SHA-256',
  digits: 8
});

// Generate a QR code URI for the user to scan
const uri = getTOTPAuthUri({
  secret,
  accountName: 'user@example.com',
  issuer: 'MyApp',
  algorithm: 'SHA-256',
  digits: 8
});

// Store the secret securely for later verification
// ...
```

### Verifying User Input with Rate Limiting

```typescript
import { verifyTOTP, RateLimiter } from 'totp-web';

// Create a rate limiter
const limiter = new RateLimiter(5, 60000); // 5 attempts per minute

async function verifyUserInput(userId: string, token: string, secret: string) {
  // Check if the user is rate limited
  if (limiter.isRateLimited(userId)) {
    const remainingTime = limiter.getTimeUntilReset(userId);
    return {
      success: false,
      message: `Too many attempts. Please try again in ${Math.ceil(remainingTime / 1000)} seconds.`
    };
  }
  
  try {
    // Verify the token
    const isValid = await verifyTOTP(token, { 
      secret,
      algorithm: 'SHA-256',
      digits: 8
    });
    
    // Reset rate limiter on successful verification
    if (isValid) {
      limiter.reset(userId);
    }
    
    return {
      success: true,
      isValid
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}
```

## Security

This library uses the Web Crypto API for cryptographic operations, which provides a secure implementation of cryptographic primitives. The TOTP implementation follows the RFC 6238 specification.

### Best Practices

1. **Secret Storage**: Always store secrets securely. In a web application, this typically means storing them on the server, not in the client.
2. **Rate Limiting**: Use the built-in `RateLimiter` class to prevent brute force attacks.
3. **Algorithm Selection**: For maximum security, use SHA-256 or SHA-512 instead of the default SHA-1.
4. **Token Length**: Consider using 8-digit tokens instead of 6-digit tokens for increased security.
5. **Custom Character Sets**: For even more security, use custom character sets with more entropy.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/AashishSinghal">Aashish Singhhal</a></p>
</div> 