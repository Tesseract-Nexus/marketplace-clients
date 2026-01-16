import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format currency with proper locale and symbol
 */
export const formatCurrency = (
  amount: number,
  currencyOrOptions?: string | { currency?: string; locale?: string; compact?: boolean },
  locale = 'en-US'
): string => {
  // Handle both old signature and new options object
  let currency = 'USD';
  let actualLocale = locale;
  let compact = false;

  if (typeof currencyOrOptions === 'string') {
    currency = currencyOrOptions;
  } else if (currencyOrOptions) {
    currency = currencyOrOptions.currency || 'USD';
    actualLocale = currencyOrOptions.locale || 'en-US';
    compact = currencyOrOptions.compact || false;
  }

  if (compact) {
    // Use compact notation for large numbers
    return new Intl.NumberFormat(actualLocale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat(actualLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency without decimal for whole numbers
 */
export const formatCurrencySmart = (amount: number, currency = 'USD', locale = 'en-US'): string => {
  const isWholeNumber = amount % 1 === 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number, locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Format date in various formats
 */
export const formatDate = (
  date: string | Date | undefined | null,
  formatStr = 'MMM d, yyyy'
): string => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch {
    return '';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (
  date: string | Date | undefined | null,
  formatStr = 'MMM d, yyyy h:mm a'
): string => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch {
    return '';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | undefined | null): string => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
};

/**
 * Format date for display with smart relative time
 */
export const formatDateSmart = (date: string | Date | undefined | null): string => {
  if (!date) {
    return '';
  }
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;

    if (isToday(d)) {
      return `Today at ${format(d, 'h:mm a')}`;
    }

    if (isYesterday(d)) {
      return `Yesterday at ${format(d, 'h:mm a')}`;
    }

    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 7) {
      return format(d, 'EEEE') + ` at ${format(d, 'h:mm a')}`;
    }

    return format(d, 'MMM d, yyyy');
  } catch {
    return '';
  }
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format order number
 */
export const formatOrderNumber = (orderNumber: string): string => {
  return `#${orderNumber}`;
};

/**
 * Format SKU
 */
export const formatSku = (sku: string): string => {
  return sku.toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format name (capitalize first letter of each word)
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get initials from name
 */
export const getInitials = (name: string, maxLength = 2): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
};

/**
 * Format address as single line
 */
export const formatAddressSingleLine = (address: {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): string => {
  const parts = [
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Format address as multiple lines
 */
export const formatAddressMultiLine = (address: {
  first_name?: string;
  last_name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): string[] => {
  const lines: string[] = [];

  if (address.first_name || address.last_name) {
    lines.push(`${address.first_name || ''} ${address.last_name || ''}`.trim());
  }

  lines.push(address.address1);

  if (address.address2) {
    lines.push(address.address2);
  }

  lines.push(`${address.city}, ${address.state} ${address.postal_code}`);
  lines.push(address.country);

  return lines;
};

/**
 * Format weight
 */
export const formatWeight = (weight: number, unit: 'kg' | 'g' | 'lb' | 'oz' = 'kg'): string => {
  const unitLabels = {
    kg: 'kg',
    g: 'g',
    lb: 'lb',
    oz: 'oz',
  };

  return `${weight} ${unitLabels[unit]}`;
};

/**
 * Format dimensions
 */
export const formatDimensions = (
  length: number,
  width: number,
  height: number,
  unit: 'cm' | 'in' = 'cm'
): string => {
  return `${length} × ${width} × ${height} ${unit}`;
};

/**
 * Convert and format currency using a rate
 * Use this for synchronous formatting when you have the rate cached
 */
export const convertAndFormatCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  options?: { compact?: boolean; locale?: string; showOriginal?: boolean }
): string => {
  const { compact = false, locale = 'en-US', showOriginal = false } = options || {};

  // Same currency
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return formatCurrency(amount, { currency: toCurrency, locale, compact });
  }

  const convertedAmount = amount * rate;
  const formatted = formatCurrency(convertedAmount, { currency: toCurrency, locale, compact });

  if (showOriginal) {
    const original = formatCurrency(amount, { currency: fromCurrency, locale, compact });
    return `${formatted} (${original})`;
  }

  return formatted;
};

/**
 * Format multiple currencies into a single value
 * Useful for showing totals from orders with different currencies
 */
export const formatTotalWithConversion = (
  items: { amount: number; currency: string; rate?: number }[],
  targetCurrency: string,
  options?: { compact?: boolean; locale?: string }
): string => {
  const { compact = false, locale = 'en-US' } = options || {};

  let total = 0;
  for (const item of items) {
    if (item.currency.toUpperCase() === targetCurrency.toUpperCase()) {
      total += item.amount;
    } else if (item.rate) {
      total += item.amount * item.rate;
    }
  }

  return formatCurrency(total, { currency: targetCurrency, locale, compact });
};
