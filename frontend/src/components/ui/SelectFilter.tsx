'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Option } from '@/lib/type';

interface SelectFilterProps {
  options: Option[];                      
  value: string | number;
  onChange: (value: string) => void;     
  placeholder?: string;
  className?: string;
  label: string;
  error?: string;
}

export default function SelectFilter({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  label,
  error,
}: SelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalizamos a string para comparar de forma segura
  const normalizedValue = value !== undefined && value !== null ? String(value) : "";
  const selectedOption = options.find(option => String(option.value) === normalizedValue);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <h6 className="text-sm font-medium text-gray-700 mb-1">{label}:</h6>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left rounded-md shadow-sm text-sm flex items-center justify-between
          ${error
            ? "border border-red-600 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            : "border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}

      {isOpen && (
        <div role="listbox" className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((option) => {
              const optValue = String(option.value);
              const isSelected = optValue === normalizedValue;
              return (
                <button
                  key={optValue}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(optValue);    // siempre devolvemos string
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
