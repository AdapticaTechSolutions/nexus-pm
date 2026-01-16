
import { CurrencyCode } from '../types';

const CURRENCY_MAP: Record<CurrencyCode, { locale: string; symbol: string }> = {
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
  JPY: { locale: 'ja-JP', symbol: '¥' },
  PHP: { locale: 'en-PH', symbol: '₱' },
  AUD: { locale: 'en-AU', symbol: 'A$' },
};

export const formatCurrency = (amount: number, code: CurrencyCode): string => {
  const config = CURRENCY_MAP[code];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getCurrencySymbol = (code: CurrencyCode): string => {
  return CURRENCY_MAP[code].symbol;
};
