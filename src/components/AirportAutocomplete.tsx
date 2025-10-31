'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAirports, getAirportByCode, Airport } from '@/lib/airports';

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label: string;
  required?: boolean;
}

export default function AirportAutocomplete({ 
  value, 
  onChange, 
  placeholder = "e.g., LHR, JFK", 
  error,
  label,
  required: _required = false
}: AirportAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update search query when value changes externally
  useEffect(() => {
    if (value && value !== searchQuery) {
      const airport = getAirportByCode(value);
      if (airport) {
        setSelectedAirport(airport);
        setSearchQuery(`${airport.code} - ${airport.name}`);
      } else {
        setSearchQuery(value);
        setSelectedAirport(null);
      }
    }
  }, [value]);

  const filteredAirports = searchAirports(searchQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setSearchQuery(newValue);
    setSelectedAirport(null);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleAirportSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setSearchQuery(`${airport.code} - ${airport.name}`);
    onChange(airport.code);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
          maxLength={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {/* Dropdown */}
        {isOpen && filteredAirports.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredAirports.map((airport) => (
              <div
                key={airport.code}
                onClick={() => handleAirportSelect(airport)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {airport.code} - {airport.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {airport.city}, {airport.country}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {airport.region}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && searchQuery.length > 0 && filteredAirports.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="px-4 py-3 text-gray-500 text-sm">
              No airports found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Selected airport info */}
      {selectedAirport && (
        <div className="mt-2 text-xs text-gray-600">
          Selected: {selectedAirport.city}, {selectedAirport.country}
        </div>
      )}
    </div>
  );
}
