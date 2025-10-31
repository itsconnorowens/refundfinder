'use client';

import { useCurrency, Currency } from '@/contexts/CurrencyContext';
import { CURRENCY_SYMBOLS } from '@/lib/currency';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  const currencies: Currency[] = ['EUR', 'USD', 'GBP'];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Currency:</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Select currency"
      >
        {currencies.map((curr) => (
          <option key={curr} value={curr}>
            {CURRENCY_SYMBOLS[curr]} {curr}
          </option>
        ))}
      </select>
    </div>
  );
}
