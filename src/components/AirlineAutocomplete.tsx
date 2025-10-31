'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAirlines, getAirlineByName, Airline } from '@/lib/airlines';

interface AirlineAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  error?: string;
  label: string;
  required?: boolean;
  isValid?: boolean;
}

export default function AirlineAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "e.g., British Airways, BA",
  error,
  label,
  required: _required = false,
  isValid = false
}: AirlineAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update search query when value changes externally
  useEffect(() => {
    if (value && value !== searchQuery) {
      const airline = getAirlineByName(value);
      if (airline) {
        // Use setTimeout to avoid synchronous state updates
        setTimeout(() => {
          setSelectedAirline(airline);
          setSearchQuery(airline.name);
        }, 0);
      } else {
        setTimeout(() => {
          setSearchQuery(value);
          setSelectedAirline(null);
        }, 0);
      }
    }
  }, [value, searchQuery]);

  const filteredAirlines = searchAirlines(searchQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setSelectedAirline(null);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleAirlineSelect = (airline: Airline) => {
    setSelectedAirline(airline);
    setSearchQuery(airline.name);
    onChange(airline.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on dropdown items
    setTimeout(() => {
      setIsOpen(false);
      // Call the onBlur prop if provided
      if (onBlur) {
        onBlur(searchQuery);
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : isValid ? 'border-green-500' : 'border-gray-300'
          }`}
        />
        {isValid && !error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xl">✓</span>
        )}
        
        {/* Dropdown */}
        {isOpen && filteredAirlines.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredAirlines.map((airline) => (
              <div
                key={airline.iataCode}
                onClick={() => handleAirlineSelect(airline)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAirlineSelect(airline);
                  }
                }}
                tabIndex={0}
                role="button"
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {airline.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {airline.country} • {airline.iataCode}/{airline.icaoCode}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {airline.alliance && (
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mb-1">
                        {airline.alliance}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {airline.region}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && searchQuery.length > 0 && filteredAirlines.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="px-4 py-3 text-gray-500 text-sm">
              No airlines found for &quot;{searchQuery}&quot;
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Selected airline info */}
      {selectedAirline && (
        <div className="mt-2 text-xs text-gray-600">
          Selected: {selectedAirline.country} • {selectedAirline.iataCode}/{selectedAirline.icaoCode}
          {selectedAirline.alliance && ` • ${selectedAirline.alliance}`}
        </div>
      )}
    </div>
  );
}
