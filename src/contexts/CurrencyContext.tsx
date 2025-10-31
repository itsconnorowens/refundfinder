'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'USD' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isEURegion: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// EU country codes for detection
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Detect currency based on country code
function detectCurrencyFromCountry(countryCode: string | null): Currency {
  if (!countryCode) return 'EUR'; // Default to EUR

  const upperCode = countryCode.toUpperCase();

  // UK uses GBP
  if (upperCode === 'GB' || upperCode === 'UK') {
    return 'GBP';
  }

  // US uses USD
  if (upperCode === 'US') {
    return 'USD';
  }

  // EU countries use EUR
  if (EU_COUNTRIES.includes(upperCode)) {
    return 'EUR';
  }

  // Default to EUR for other countries
  return 'EUR';
}

// Check if user is in EU region
function isEUCountry(countryCode: string | null): boolean {
  if (!countryCode) return true; // Default to EU
  return EU_COUNTRIES.includes(countryCode.toUpperCase());
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EUR');
  const [isEURegion, setIsEURegion] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage first for user preference
    const savedCurrency = localStorage.getItem('preferredCurrency') as Currency | null;

    if (savedCurrency && ['EUR', 'USD', 'GBP'].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
      setIsEURegion(savedCurrency === 'EUR');
      setIsInitialized(true);
      return;
    }

    // Detect from geolocation
    async function detectLocation() {
      try {
        // Try to get geolocation from a server endpoint
        const response = await fetch('/api/geo');
        const data = await response.json();

        const detectedCurrency = detectCurrencyFromCountry(data.country);
        const isEU = isEUCountry(data.country);

        setCurrencyState(detectedCurrency);
        setIsEURegion(isEU);
      } catch (error: unknown) {
        // Fallback to EUR if detection fails
        console.error('Currency detection failed:', error);
        setCurrencyState('EUR');
        setIsEURegion(true);
      } finally {
        setIsInitialized(true);
      }
    }

    detectLocation();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    setIsEURegion(newCurrency === 'EUR');
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  // Don't render children until currency is initialized to avoid flash
  if (!isInitialized) {
    return null;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isEURegion }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
