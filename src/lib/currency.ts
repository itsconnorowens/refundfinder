import { Currency } from '@/contexts/CurrencyContext';

export type { Currency };

// Hardcoded service fees per currency
export const SERVICE_FEES: Record<Currency, number> = {
  USD: 4900, // $49.00 in cents
  EUR: 4500, // €45.00 in cents
  GBP: 3900, // £39.00 in cents
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Get service fee for a currency (in cents)
export function getServiceFee(currency: Currency): number {
  return SERVICE_FEES[currency];
}

// Get service fee formatted for display
export function getServiceFeeFormatted(currency: Currency): string {
  const cents = SERVICE_FEES[currency];
  return formatCurrency(cents / 100, currency);
}

// Format currency using Intl.NumberFormat
export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get locale for currency
function getLocaleForCurrency(currency: Currency): string {
  switch (currency) {
    case 'USD':
      return 'en-US';
    case 'EUR':
      return 'en-EU';
    case 'GBP':
      return 'en-GB';
    default:
      return 'en-US';
  }
}

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

// Compensation amounts in EUR (regulatory amounts)
export const EU_COMPENSATION_AMOUNTS = {
  SHORT: 250, // < 1,500km
  MEDIUM: 400, // 1,500-3,500km
  LONG: 600, // > 3,500km
};

// Approximate conversion rates for display (hardcoded, not real-time)
// These are rough estimates for showing compensation in local currency
const APPROX_CONVERSION_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08, // 1 EUR ≈ 1.08 USD
  GBP: 0.86, // 1 EUR ≈ 0.86 GBP
};

// Convert EUR compensation amount to other currency (approximate)
export function convertCompensationAmount(eurAmount: number, targetCurrency: Currency): number {
  if (targetCurrency === 'EUR') return eurAmount;
  return Math.round(eurAmount * APPROX_CONVERSION_RATES[targetCurrency]);
}

// Format compensation amount - shows clean local currency
export function formatCompensationAmount(
  eurAmount: number,
  displayCurrency: Currency,
  isEURegion: boolean
): string {
  if (isEURegion || displayCurrency === 'EUR') {
    // EU users always see EUR (regulatory currency)
    return formatCurrency(eurAmount, 'EUR');
  }

  // Non-EU users see clean local currency amount
  const convertedAmount = convertCompensationAmount(eurAmount, displayCurrency);
  return formatCurrency(convertedAmount, displayCurrency);
}

// Format compensation range - shows clean local currency
export function formatCompensationRange(
  minEur: number,
  maxEur: number,
  displayCurrency: Currency,
  isEURegion: boolean
): string {
  if (isEURegion || displayCurrency === 'EUR') {
    return `${formatCurrency(minEur, 'EUR')}-${formatCurrency(maxEur, 'EUR')}`;
  }

  const minConverted = convertCompensationAmount(minEur, displayCurrency);
  const maxConverted = convertCompensationAmount(maxEur, displayCurrency);

  return `${formatCurrency(minConverted, displayCurrency)}-${formatCurrency(maxConverted, displayCurrency)}`;
}

// Simple compensation display (just the amount, no range)
export function getCompensationDisplay(
  eurAmount: number,
  displayCurrency: Currency,
  isEURegion: boolean
): { primary: string; secondary?: string } {
  if (isEURegion || displayCurrency === 'EUR') {
    return {
      primary: formatCurrency(eurAmount, 'EUR'),
    };
  }

  const convertedAmount = convertCompensationAmount(eurAmount, displayCurrency);
  return {
    primary: formatCurrency(convertedAmount, displayCurrency),
  };
}
