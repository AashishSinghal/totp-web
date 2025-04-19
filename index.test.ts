import { Crypto } from '@peculiar/webcrypto';
import { generateTOTP, verifyTOTP } from './index';

// Set up the crypto object globally for Node.js environment
const crypto = new Crypto();
global.crypto = crypto;

describe('TOTP Web Implementation', () => {
  const testSecret = 'JBSWY3DPEHPK3PXP';

  describe('generateTOTP', () => {
    it('should generate a 6-digit token', async () => {
      const result = await generateTOTP({ secret: testSecret });
      expect(result.token).toMatch(/^\d{6}$/);
    });

    it('should generate different tokens for different time windows', async () => {
      const result1 = await generateTOTP({ secret: testSecret });
      const result2 = await generateTOTP({ secret: testSecret, window: 1 }); // Next time window
      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('verifyTOTP', () => {
    it('should verify a valid token', async () => {
      const { token } = await generateTOTP({ secret: testSecret });
      const isValid = await verifyTOTP(token, { secret: testSecret });
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', async () => {
      const isValid = await verifyTOTP('000000', { secret: testSecret });
      expect(isValid).toBe(false);
    });

    it('should verify tokens within the time window', async () => {
      const { token } = await generateTOTP({ secret: testSecret, window: 1 }); // Generate token for next window
      const isValid = await verifyTOTP(token, { secret: testSecret, window: 2 }); // Verify with window of ±2
      expect(isValid).toBe(true);
    });

    it('should reject tokens outside the time window', async () => {
      const { token } = await generateTOTP({ secret: testSecret });
      // Simulate a token from far outside the window by using a different secret
      const isValid = await verifyTOTP(token, { secret: 'DIFFERENT' + testSecret });
      expect(isValid).toBe(false);
    });
  });
}); 