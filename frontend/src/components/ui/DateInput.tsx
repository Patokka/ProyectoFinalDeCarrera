'use client';

import { useRef } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;

}

export default function DateInput({ value, onChange, label, placeholder = '', className = '', disabled = false, error,}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 
                ${error ? "border-red-600 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-red-100 disabled:text-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"}`}
        />
        {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}