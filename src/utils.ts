import { generateTOTP, verifyTOTP, TOTPAlgorithm } from './index';

/**
 * Utility class for common TOTP operations
 */
export class TOTPUtils {
  /**
   * Generate a random secret key
   * @returns A base32-encoded secret key
   */
  static generateSecret(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < bytes.length; i++) {
      secret += base32Chars[bytes[i] % 32];
    }
    return secret;
  }

  /**
   * Generate backup codes for account recovery
   * @param count Number of backup codes to generate (default: 8)
   * @param length Length of each backup code (default: 8)
   * @returns Array of backup codes
   */
  static generateBackupCodes(count: number = 8, length: number = 8): string[] {
    const codes: string[] = [];
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar looking characters
    
    for (let i = 0; i < count; i++) {
      let code = '';
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      
      for (let j = 0; j < length; j++) {
        code += chars[bytes[j] % chars.length];
      }
      
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Test TOTP configuration by generating and verifying a token
   * @param options TOTP configuration options
   * @returns Promise that resolves to true if test passes
   */
  static async testConfiguration(options: {
    secret?: string;
    algorithm?: TOTPAlgorithm;
    digits?: number;
    period?: number;
    charSet?: string;
  }): Promise<boolean> {
    try {
      const result = await generateTOTP(options);
      const isValid = await verifyTOTP(result.token, {
        ...options,
        secret: result.secret
      });
      return isValid;
    } catch (error) {
      console.error('Configuration test failed:', error);
      return false;
    }
  }

  /**
   * Format time remaining until next TOTP token
   * @param remainingSeconds Number of seconds remaining
   * @returns Formatted time string (e.g., "29s")
   */
  static formatTimeRemaining(remainingSeconds: number): string {
    if (remainingSeconds < 60) {
      return `${remainingSeconds}s`;
    }
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Validate TOTP configuration options
   * @param options TOTP configuration options
   * @returns Object containing validation results and errors
   */
  static validateConfiguration(options: {
    algorithm?: TOTPAlgorithm;
    digits?: number;
    period?: number;
    charSet?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.algorithm && !['SHA-1', 'SHA-256', 'SHA-512'].includes(options.algorithm)) {
      errors.push('Algorithm must be one of: SHA-1, SHA-256, SHA-512');
    }

    if (options.digits && (options.digits < 4 || options.digits > 8)) {
      errors.push('Digits must be between 4 and 8');
    }

    if (options.period && (options.period < 15 || options.period > 60)) {
      errors.push('Period must be between 15 and 60 seconds');
    }

    if (options.charSet && options.charSet.length < 10) {
      errors.push('Character set must have at least 10 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 