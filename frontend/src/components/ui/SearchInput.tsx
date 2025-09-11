'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label: string;
}

export default function SearchInput({ placeholder = "Buscar...", value, onChange, className = "" , label}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce para evitar demasiadas llamadas
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Sincronizar con el valor externo
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
    <h6 className="text-sm font-medium text-gray-700 mb-3">{label}:</h6>
      <div className="absolute py-3 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}