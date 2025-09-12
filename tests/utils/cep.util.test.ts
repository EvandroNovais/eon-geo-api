import { isValidCep, formatCep, formatCepWithHyphen, validateCepOrThrow } from '../../src/utils/cep.util';

describe('CEP Utilities', () => {
  describe('isValidCep', () => {
    it('should return true for valid CEPs without hyphen', () => {
      expect(isValidCep('01310100')).toBe(true);
      expect(isValidCep('20040020')).toBe(true);
    });

    it('should return true for valid CEPs with hyphen', () => {
      expect(isValidCep('01310-100')).toBe(true);
      expect(isValidCep('20040-020')).toBe(true);
    });

    it('should return false for invalid CEPs', () => {
      expect(isValidCep('1234567')).toBe(false); // Too short
      expect(isValidCep('123456789')).toBe(false); // Too long
      expect(isValidCep('00000000')).toBe(false); // All zeros
      expect(isValidCep('11111111')).toBe(false); // All same digit
      expect(isValidCep('1234567a')).toBe(false); // Contains letter
      expect(isValidCep('')).toBe(false); // Empty string
    });
  });

  describe('formatCep', () => {
    it('should remove non-numeric characters', () => {
      expect(formatCep('01310-100')).toBe('01310100');
      expect(formatCep('01310.100')).toBe('01310100');
      expect(formatCep('01310 100')).toBe('01310100');
    });

    it('should handle empty string', () => {
      expect(formatCep('')).toBe('');
    });
  });

  describe('formatCepWithHyphen', () => {
    it('should add hyphen to 8-digit CEP', () => {
      expect(formatCepWithHyphen('01310100')).toBe('01310-100');
      expect(formatCepWithHyphen('01310-100')).toBe('01310-100');
    });

    it('should return unchanged for invalid length', () => {
      expect(formatCepWithHyphen('1234567')).toBe('1234567');
    });
  });

  describe('validateCepOrThrow', () => {
    it('should not throw for valid CEPs', () => {
      expect(() => validateCepOrThrow('01310100')).not.toThrow();
      expect(() => validateCepOrThrow('01310-100')).not.toThrow();
    });

    it('should throw for invalid CEPs', () => {
      expect(() => validateCepOrThrow('')).toThrow('CEP is required');
      expect(() => validateCepOrThrow('1234567')).toThrow('CEP format is invalid');
      expect(() => validateCepOrThrow('00000000')).toThrow('CEP format is invalid');
    });
  });
});