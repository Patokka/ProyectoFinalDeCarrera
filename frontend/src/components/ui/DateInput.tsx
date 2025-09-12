'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function DateInput({
  value,
  onChange,
  label,
  placeholder = '',
  className = '',
  disabled = false
}: DateInputProps) {
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
          className="w-full px-3 py-2 pr-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>
    </div>
  );
}