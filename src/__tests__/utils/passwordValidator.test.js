import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  getStrengthColor,
  getRequirementItems,
  PASSWORD_REQUIREMENTS
} from '../../utils/passwordValidator';

describe('passwordValidator', () => {
  describe('validatePassword', () => {
    it('should return all false for empty password', () => {
      const result = validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.strength).toBe(0);
      expect(result.strengthLabel).toBe('None');
      expect(result.requirements.minLength).toBe(false);
      expect(result.requirements.hasUppercase).toBe(false);
      expect(result.requirements.hasLowercase).toBe(false);
      expect(result.requirements.hasNumber).toBe(false);
      expect(result.requirements.hasSpecial).toBe(false);
    });

    it('should return all false for null/undefined password', () => {
      const resultNull = validatePassword(null);
      const resultUndefined = validatePassword(undefined);

      expect(resultNull.isValid).toBe(false);
      expect(resultUndefined.isValid).toBe(false);
    });

    it('should accept a strong password', () => {
      const result = validatePassword('Password@123');

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe(5);
      expect(result.strengthLabel).toBe('Very Strong');
      expect(result.requirements.minLength).toBe(true);
      expect(result.requirements.hasUppercase).toBe(true);
      expect(result.requirements.hasLowercase).toBe(true);
      expect(result.requirements.hasNumber).toBe(true);
      expect(result.requirements.hasSpecial).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pa@1');

      expect(result.isValid).toBe(false);
      expect(result.requirements.minLength).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('password@123');

      expect(result.isValid).toBe(false);
      expect(result.requirements.hasUppercase).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD@123');

      expect(result.isValid).toBe(false);
      expect(result.requirements.hasLowercase).toBe(false);
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password@abc');

      expect(result.isValid).toBe(false);
      expect(result.requirements.hasNumber).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = validatePassword('Password123');

      expect(result.isValid).toBe(false);
      expect(result.requirements.hasSpecial).toBe(false);
    });

    it('should calculate correct strength for various passwords', () => {
      // Strength 1 - only minLength
      expect(validatePassword('abcdefgh').strength).toBe(2); // minLength + lowercase
      expect(validatePassword('abcdefgh').strengthLabel).toBe('Weak');

      // Strength 3
      expect(validatePassword('Abcdefgh').strength).toBe(3); // minLength + upper + lower
      expect(validatePassword('Abcdefgh').strengthLabel).toBe('Fair');

      // Strength 4
      expect(validatePassword('Abcdefg1').strength).toBe(4); // minLength + upper + lower + number
      expect(validatePassword('Abcdefg1').strengthLabel).toBe('Strong');
    });
  });

  describe('getStrengthColor', () => {
    it('should return gray for strength 0', () => {
      expect(getStrengthColor(0)).toBe('#e0e0e0');
    });

    it('should return red for strength 1', () => {
      expect(getStrengthColor(1)).toBe('#f44336');
    });

    it('should return orange for strength 2', () => {
      expect(getStrengthColor(2)).toBe('#ff9800');
    });

    it('should return yellow for strength 3', () => {
      expect(getStrengthColor(3)).toBe('#ffeb3b');
    });

    it('should return light green for strength 4', () => {
      expect(getStrengthColor(4)).toBe('#8bc34a');
    });

    it('should return green for strength 5', () => {
      expect(getStrengthColor(5)).toBe('#4caf50');
    });
  });

  describe('getRequirementItems', () => {
    it('should return 5 requirement items', () => {
      const items = getRequirementItems();

      expect(items).toHaveLength(5);
    });

    it('should have key and label for each item', () => {
      const items = getRequirementItems();

      items.forEach(item => {
        expect(item).toHaveProperty('key');
        expect(item).toHaveProperty('label');
        expect(typeof item.key).toBe('string');
        expect(typeof item.label).toBe('string');
      });
    });

    it('should include all required keys', () => {
      const items = getRequirementItems();
      const keys = items.map(item => item.key);

      expect(keys).toContain('minLength');
      expect(keys).toContain('hasUppercase');
      expect(keys).toContain('hasLowercase');
      expect(keys).toContain('hasNumber');
      expect(keys).toContain('hasSpecial');
    });
  });

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should have test function for each requirement', () => {
      Object.values(PASSWORD_REQUIREMENTS).forEach(req => {
        expect(typeof req.test).toBe('function');
        expect(typeof req.label).toBe('string');
      });
    });

    it('minLength test should work correctly', () => {
      expect(PASSWORD_REQUIREMENTS.minLength.test('1234567')).toBe(false);
      expect(PASSWORD_REQUIREMENTS.minLength.test('12345678')).toBe(true);
    });

    it('hasUppercase test should work correctly', () => {
      expect(PASSWORD_REQUIREMENTS.hasUppercase.test('lowercase')).toBe(false);
      expect(PASSWORD_REQUIREMENTS.hasUppercase.test('Uppercase')).toBe(true);
    });

    it('hasLowercase test should work correctly', () => {
      expect(PASSWORD_REQUIREMENTS.hasLowercase.test('UPPERCASE')).toBe(false);
      expect(PASSWORD_REQUIREMENTS.hasLowercase.test('lowercase')).toBe(true);
    });

    it('hasNumber test should work correctly', () => {
      expect(PASSWORD_REQUIREMENTS.hasNumber.test('NoNumbers')).toBe(false);
      expect(PASSWORD_REQUIREMENTS.hasNumber.test('With1Number')).toBe(true);
    });

    it('hasSpecial test should work correctly', () => {
      expect(PASSWORD_REQUIREMENTS.hasSpecial.test('NoSpecial123')).toBe(false);
      expect(PASSWORD_REQUIREMENTS.hasSpecial.test('Special@123')).toBe(true);
    });
  });
});
