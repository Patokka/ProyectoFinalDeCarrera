'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * @interface SearchInputProps
 * @description Propiedades para el componente SearchInput.
 * @property {string} [placeholder] - Texto placeholder para el campo.
 * @property {string} value - El valor actual del campo de búsqueda.
 * @property {(value: string) => void} onChange - Callback que se ejecuta cuando el valor cambia (con debounce).
 * @property {string} [className] - Clases CSS adicionales.
 * @property {string} label - La etiqueta a mostrar sobre el campo.
 */
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label: string;
}

/**
 * @component SearchInput
 * @description Un componente de campo de búsqueda reutilizable con un ícono de lupa y
 *              una función de "debounce" para optimizar el rendimiento de la búsqueda.
 * @param {SearchInputProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de búsqueda.
 */
export default function SearchInput({ placeholder = "Buscar...", value, onChange, className = "" , label}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  /**
   * @effect
   * @description Implementa un "debounce" para que la función `onChange` solo se llame
   *              300ms después de que el usuario deja de escribir, evitando llamadas excesivas.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  /**
   * @effect
   * @description Sincroniza el estado local con el valor externo si este cambia
   *              desde el componente padre (por ejemplo, al limpiar filtros).
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <h6 className="text-sm font-medium text-gray-700 mb-1">{label}:</h6>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none top-6">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10"
      />
    </div>
  );
}
