import { Crypto } from '@peculiar/webcrypto';
import { generateTOTP, verifyTOTP, getTOTPAuthUri, RateLimiter } from './src/index';

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

    it('should generate tokens with custom digits', async () => {
      const result = await generateTOTP({ secret: testSecret, digits: 8 });
      expect(result.token).toMatch(/^\d{8}$/);
    });

    it('should generate tokens with custom character set', async () => {
      const result = await generateTOTP({ 
        secret: testSecret, 
        charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digits: 4
      });
      expect(result.token).toMatch(/^[A-Z]{4}$/);
    });

    it('should generate tokens with different algorithms', async () => {
      const result1 = await generateTOTP({ secret: testSecret, algorithm: 'SHA-1' });
      const result2 = await generateTOTP({ secret: testSecret, algorithm: 'SHA-256' });
      expect(result1.token).not.toBe(result2.token);
    });

    it('should respect custom period', async () => {
      const result = await generateTOTP({ secret: testSecret, period: 60 });
      expect(result.remainingSeconds).toBeLessThanOrEqual(60);
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

    it('should verify tokens with custom character set', async () => {
      const { token } = await generateTOTP({ 
        secret: testSecret, 
        charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digits: 4
      });
      const isValid = await verifyTOTP(token, { 
        secret: testSecret,
        charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digits: 4
      });
      expect(isValid).toBe(true);
    });

    it('should verify tokens with different algorithms', async () => {
      const { token } = await generateTOTP({ secret: testSecret, algorithm: 'SHA-256' });
      const isValid = await verifyTOTP(token, { secret: testSecret, algorithm: 'SHA-256' });
      expect(isValid).toBe(true);
    });
  });

  describe('getTOTPAuthUri', () => {
    it('should generate a valid URI', () => {
      const uri = getTOTPAuthUri({
        secret: testSecret,
        accountName: 'test@example.com',
        issuer: 'TestApp'
      });
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=' + testSecret);
      expect(uri).toContain('issuer=TestApp');
    });

    it('should include algorithm in URI', () => {
      const uri = getTOTPAuthUri({
        secret: testSecret,
        accountName: 'test@example.com',
        algorithm: 'SHA-256'
      });
      expect(uri).toContain('algorithm=sha-256');
    });

    it('should include digits in URI', () => {
      const uri = getTOTPAuthUri({
        secret: testSecret,
        accountName: 'test@example.com',
        digits: 8
      });
      expect(uri).toContain('digits=8');
    });

    it('should include period in URI', () => {
      const uri = getTOTPAuthUri({
        secret: testSecret,
        accountName: 'test@example.com',
        period: 60
      });
      expect(uri).toContain('period=60');
    });
  });

  describe('RateLimiter', () => {
    it('should allow attempts within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.isRateLimited('test')).toBe(false); // 1st attempt
      expect(limiter.isRateLimited('test')).toBe(false); // 2nd attempt
      expect(limiter.isRateLimited('test')).toBe(false); // 3rd attempt
      expect(limiter.isRateLimited('test')).toBe(true);  // 4th attempt (blocked)
    });

    it('should reset after window expires', () => {
      const limiter = new RateLimiter(2, 100);
      
      expect(limiter.isRateLimited('test')).toBe(false); // 1st attempt
      expect(limiter.isRateLimited('test')).toBe(false); // 2nd attempt
      expect(limiter.isRateLimited('test')).toBe(true);  // 3rd attempt (blocked)
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          expect(limiter.isRateLimited('test')).toBe(false); // Should be allowed after window expires
          resolve(null);
        }, 150);
      });
    });

    it('should track remaining attempts', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.getRemainingAttempts('test')).toBe(3);
      limiter.isRateLimited('test'); // 1st attempt
      expect(limiter.getRemainingAttempts('test')).toBe(2);
      limiter.isRateLimited('test'); // 2nd attempt
      expect(limiter.getRemainingAttempts('test')).toBe(1);
      limiter.isRateLimited('test'); // 3rd attempt
      expect(limiter.getRemainingAttempts('test')).toBe(0);
    });

    it('should reset attempts', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.isRateLimited('test'); // 1st attempt
      limiter.isRateLimited('test'); // 2nd attempt
      expect(limiter.isRateLimited('test')).toBe(true); // 3rd attempt (blocked)
      
      limiter.reset('test');
      expect(limiter.isRateLimited('test')).toBe(false); // Should be allowed after reset
      expect(limiter.getRemainingAttempts('test')).toBe(1); // One attempt used
    });

    it('should calculate time until reset', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.isRateLimited('test');
      limiter.isRateLimited('test');
      
      const timeUntilReset = limiter.getTimeUntilReset('test');
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
      expect(timeUntilReset).toBeGreaterThan(0);
    });
  });
}); 