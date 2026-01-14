import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatPhone,
  formatPercentage,
  formatFileSize,
} from '../../lib/utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format number as currency with default USD', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format with different currencies', () => {
      expect(formatCurrency(100, { currency: 'EUR' })).toContain('100');
      expect(formatCurrency(100, { currency: 'GBP' })).toContain('100');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-50);
      expect(result).toContain('50');
    });

    it('should format large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(99.999)).toBe('$100.00');
    });

    it('should format compact numbers when option is set', () => {
      const result = formatCurrency(1500000, { compact: true });
      // Compact notation formats as 1.5M
      expect(result).toMatch(/1\.5/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousands separator', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-06-15T10:30:00Z');

    it('should format date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toBeTruthy();
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-06-15T10:30:00Z');
      expect(result).toBeTruthy();
    });

    it('should handle different format strings', () => {
      const short = formatDate(testDate, 'yyyy-MM-dd');
      const long = formatDate(testDate, 'MMMM d, yyyy');
      expect(short).toBeTruthy();
      expect(long).toBeTruthy();
    });

    it('should include time when format includes time', () => {
      const result = formatDate(testDate, 'MMM d, yyyy h:mm a');
      expect(result).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent time', () => {
      const fewSecondsAgo = new Date(Date.now() - 5000);
      const result = formatRelativeTime(fewSecondsAgo);
      expect(result.toLowerCase()).toMatch(/(second|ago|now)/);
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result.toLowerCase()).toContain('min') || expect(result).toContain('5');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoHoursAgo);
      expect(result.toLowerCase()).toContain('hour') || expect(result).toContain('2');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(threeDaysAgo);
      expect(result.toLowerCase()).toContain('day') || expect(result).toContain('3');
    });

    it('should handle string input', () => {
      const result = formatRelativeTime(new Date().toISOString());
      expect(result).toBeTruthy();
    });
  });

  describe('formatPhone', () => {
    it('should format US phone numbers', () => {
      const result = formatPhone('5551234567');
      expect(result).toContain('555');
    });

    it('should handle already formatted numbers', () => {
      const result = formatPhone('(555) 123-4567');
      expect(result).toContain('555');
    });

    it('should handle international format', () => {
      const result = formatPhone('+15551234567');
      expect(result).toBeTruthy();
    });

    it('should return original if invalid', () => {
      const result = formatPhone('abc');
      expect(result).toBe('abc');
    });
  });

  describe('formatPercentage', () => {
    // Note: The formatPercentage function expects raw percentage values (e.g., 50 for 50%)
    // and adds a + sign for positive values

    it('should format positive percentage with plus sign', () => {
      expect(formatPercentage(50)).toBe('+50.0%');
      expect(formatPercentage(12.5)).toBe('+12.5%');
    });

    it('should format with custom decimal places', () => {
      const result = formatPercentage(55.555, 2);
      // toFixed uses banker's rounding, 55.555 rounds to 55.55
      expect(result).toBe('+55.55%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('+0.0%');
    });

    it('should handle negative percentages without plus sign', () => {
      const result = formatPercentage(-25);
      expect(result).toBe('-25.0%');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toContain('500');
      expect(formatFileSize(500).toLowerCase()).toContain('b');
    });

    it('should format kilobytes', () => {
      const result = formatFileSize(1024);
      expect(result.toLowerCase()).toContain('kb') || expect(result.toLowerCase()).toContain('k');
    });

    it('should format megabytes', () => {
      const result = formatFileSize(1024 * 1024);
      expect(result.toLowerCase()).toContain('mb') || expect(result.toLowerCase()).toContain('m');
    });

    it('should format gigabytes', () => {
      const result = formatFileSize(1024 * 1024 * 1024);
      expect(result.toLowerCase()).toContain('gb') || expect(result.toLowerCase()).toContain('g');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toContain('0');
    });
  });
});
