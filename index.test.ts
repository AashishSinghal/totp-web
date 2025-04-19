import { generateTOTP, verifyTOTP } from './index';

describe('TOTP Web Implementation', () => {
  const testSecret = 'JBSWY3DPEHPK3PXP';

  describe('generateTOTP', () => {
    it('should generate a 6-digit token', async () => {
      const token = await generateTOTP(testSecret);
      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate different tokens for different time windows', async () => {
      const token1 = await generateTOTP(testSecret);
      const token2 = await generateTOTP(testSecret, 1); // Next time window
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyTOTP', () => {
    it('should verify a valid token', async () => {
      const token = await generateTOTP(testSecret);
      const isValid = await verifyTOTP(testSecret, token);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', async () => {
      const isValid = await verifyTOTP(testSecret, '000000');
      expect(isValid).toBe(false);
    });

    it('should verify tokens within the time window', async () => {
      const token = await generateTOTP(testSecret, 1); // Generate token for next window
      const isValid = await verifyTOTP(testSecret, token, 2); // Verify with window of ±2
      expect(isValid).toBe(true);
    });

    it('should reject tokens outside the time window', async () => {
      const token = await generateTOTP(testSecret, 3); // Generate token for far future window
      const isValid = await verifyTOTP(testSecret, token, 1); // Verify with default window
      expect(isValid).toBe(false);
    });
  });
}); 