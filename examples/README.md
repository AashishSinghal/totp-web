# TOTP Web Examples

This directory contains example applications demonstrating how to use the `totp-web` package in different scenarios.

## React Demo

A React application that demonstrates:
- TOTP token generation
- Token verification
- QR code generation for authenticator apps
- Real-time token updates
- Error handling

### Running the React Demo

1. Navigate to the demo directory:
   ```bash
   cd react-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Features Demonstrated

- **Token Generation**: Automatically generates and updates TOTP tokens every 30 seconds
- **QR Code**: Displays a QR code that can be scanned by authenticator apps
- **Token Verification**: Allows users to verify tokens manually
- **Error Handling**: Demonstrates proper error handling for invalid inputs
- **Real-time Updates**: Shows the remaining time until the next token update

### Code Examples

```typescript
// Generate a new TOTP token
const result = await generateTOTP();
console.log('Token:', result.token);
console.log('Secret:', result.secret);
console.log('Remaining seconds:', result.remainingSeconds);

// Generate QR code URI
const uri = getTOTPAuthUri({
  secret: result.secret,
  accountName: 'user@example.com',
  issuer: 'My App'
});

// Verify a token
const isValid = await verifyTOTP('123456', { secret: result.secret });
console.log('Token is valid:', isValid);
``` 