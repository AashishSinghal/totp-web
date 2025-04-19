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
```

### Generating QR Codes for Authenticator Apps

```typescript
import { getTOTPAuthUri } from 'totp-web';

// Generate a URI for QR code generation
const secret = 'JBSWY3DPEHPK3PXP';
const uri = getTOTPAuthUri({
  secret,
  accountName: 'user@example.com',
  issuer: 'MyApp'
});

// Use this URI with any QR code library
// For example, with qrcode.react:
import { QRCodeSVG } from 'qrcode.react';

function QRCodeComponent() {
  return <QRCodeSVG value={uri} size={200} />;
}
```

### Complete Example with React

```tsx
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateTOTP, verifyTOTP, getTOTPAuthUri } from 'totp-web';

function TOTPComponent() {
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [qrUri, setQrUri] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  useEffect(() => {
    // Generate a new secret when component mounts
    const generateNewSecret = async () => {
      const result = await generateTOTP({});
      setSecret(result.secret);
      setRemainingSeconds(result.remainingSeconds);
      
      // Generate QR code URI
      setQrUri(getTOTPAuthUri({
        secret: result.secret,
        accountName: 'user@example.com',
        issuer: 'MyApp'
      }));
    };

    generateNewSecret();
  }, []);

  // Update token every second
  useEffect(() => {
    const updateToken = async () => {
      if (!secret) return;
      const result = await generateTOTP({ secret });
      setToken(result.token);
      setRemainingSeconds(result.remainingSeconds);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const handleVerify = async () => {
    if (!secret || !verificationToken) return;
    const result = await verifyTOTP(verificationToken, { secret });
    setIsValid(result);
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
      
      {isValid !== null && (
        <div style={{ color: isValid ? 'green' : 'red' }}>
          {isValid ? 'Token is valid!' : 'Token is invalid!'}
        </div>
      )}
    </div>
  );
}
```

## API Reference

### generateTOTP(options: { secret?: string }): Promise<{ token: string, secret: string, remainingSeconds: number }>

Generates a TOTP token and related information.

- `options.secret`: Optional Base32 encoded secret key. If not provided, a new secret will be generated.
- Returns: Promise resolving to an object containing:
  - `token`: The 6-digit TOTP token
  - `secret`: The secret used to generate the token
  - `remainingSeconds`: Seconds until the token expires

### verifyTOTP(token: string, options: { secret: string, window?: number }): Promise<boolean>

Verifies a TOTP token against a secret.

- `token`: The TOTP token to verify
- `options.secret`: Base32 encoded secret key
- `options.window`: Optional time window for validation (default: 1, meaning ±30 seconds)
- Returns: Promise resolving to boolean indicating if the token is valid

### getTOTPAuthUri(options: { secret: string, accountName: string, issuer?: string }): string

Generates a URI for QR code generation compatible with authenticator apps.

- `options.secret`: Base32 encoded secret key
- `options.accountName`: The account name to display in the authenticator app
- `options.issuer`: Optional issuer name to display in the authenticator app
- Returns: A URI string that can be encoded as a QR code

## Examples

### Setting Up 2FA for a User

```typescript
import { generateTOTP, getTOTPAuthUri } from 'totp-web';

async function setup2FA() {
  // Generate a new secret for the user
  const { secret } = await generateTOTP({});
  
  // Generate a QR code URI for the user to scan
  const uri = getTOTPAuthUri({
    secret,
    accountName: 'user@example.com',
    issuer: 'MyApp'
  });
  
  // Store the secret securely (e.g., in your database)
  // In a real application, this would be encrypted
  await saveUserSecret(userId, secret);
  
  // Return the URI for QR code generation
  return uri;
}
```

### Verifying a User's 2FA Token

```typescript
import { verifyTOTP } from 'totp-web';

async function verifyUserToken(userId, token) {
  // Retrieve the user's secret from your database
  const secret = await getUserSecret(userId);
  
  // Verify the token
  const isValid = await verifyTOTP(token, { secret });
  
  if (isValid) {
    // Token is valid, proceed with authentication
    return true;
  } else {
    // Token is invalid, authentication failed
    return false;
  }
}
```

### Creating a TOTP Manager Component

```tsx
import React, { useState, useEffect } from 'react';
import { generateTOTP, verifyTOTP, getTOTPAuthUri } from 'totp-web';
import { QRCodeSVG } from 'qrcode.react';

function TOTPManager() {
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [qrUri, setQrUri] = useState('');
  
  // Generate a new secret on component mount
  useEffect(() => {
    const init = async () => {
      const result = await generateTOTP({});
      setSecret(result.secret);
      setRemainingSeconds(result.remainingSeconds);
      
      setQrUri(getTOTPAuthUri({
        secret: result.secret,
        accountName: 'user@example.com',
        issuer: 'MyApp'
      }));
    };
    
    init();
  }, []);
  
  // Update token every second
  useEffect(() => {
    if (!secret) return;
    
    const updateToken = async () => {
      const result = await generateTOTP({ secret });
      setToken(result.token);
      setRemainingSeconds(result.remainingSeconds);
    };
    
    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [secret]);
  
  return (
    <div className="totp-manager">
      <div className="secret-section">
        <h3>Your Secret</h3>
        <code>{secret}</code>
        <button onClick={() => navigator.clipboard.writeText(secret)}>
          Copy
        </button>
      </div>
      
      <div className="qr-section">
        <h3>Scan QR Code</h3>
        {qrUri && <QRCodeSVG value={qrUri} size={200} />}
      </div>
      
      <div className="token-section">
        <h3>Current Token</h3>
        <div className="token">{token}</div>
        <div className="countdown">
          Expires in {remainingSeconds} seconds
        </div>
        <div 
          className="progress-bar"
          style={{ width: `${(remainingSeconds / 30) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

## Security Considerations

- **Secret Storage**: The secret key should be securely stored and transmitted. In a real application, secrets should be encrypted at rest.
- **Algorithm**: This implementation uses SHA-1 HMAC as specified in RFC 6238.
- **Time Windows**: The default verification window of ±30 seconds allows for clock skew between the server and client.
- **Web Crypto API**: The library uses the Web Crypto API for secure cryptographic operations, which is more secure than JavaScript-based implementations.
- **Client-Side Limitations**: While this library enables client-side TOTP generation, be aware that client-side JavaScript can be manipulated by malicious actors. For highly secure applications, consider using hardware security keys or other more secure 2FA methods.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/AashishSinghal">Aashish Singhhal</a></p>
</div> 