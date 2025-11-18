'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Option } from '@/lib/type';

/**
 * @interface SelectFilterProps
 * @description Propiedades para el componente SelectFilter.
 * @property {Option[]} options - Array de opciones a mostrar.
 * @property {string | number} value - El valor actualmente seleccionado.
 * @property {(value: string) => void} onChange - Callback que se ejecuta al seleccionar una opción.
 * @property {string} [placeholder] - Texto a mostrar cuando no hay valor seleccionado.
 * @property {string} [className] - Clases CSS adicionales.
 * @property {string} label - La etiqueta del campo.
 * @property {string} [error] - Mensaje de error a mostrar.
 */
interface SelectFilterProps {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label: string;
  error?: string;
}

/**
 * @component SelectFilter
 * @description Un componente de selector desplegable personalizado y accesible.
 * @param {SelectFilterProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente de selector.
 */
export default function SelectFilter({options, value, onChange, placeholder = "Seleccionar...", className = "", label, error}: SelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedValue = value != null ? String(value) : "";
  const selectedOption = options.find(option => String(option.value) === normalizedValue);

  /**
   * @effect
   * @description Cierra el menú desplegable si se hace clic fuera del componente.
   */
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
      <h6 className="block text-sm font-medium text-gray-700 mb-1">{label}:</h6>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field flex items-center justify-between text-left ${error ? 'error' : ''}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="error-message">{error}</p>}

      {isOpen && (
        <div role="listbox" className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map(option => (
              <button
                key={String(option.value)}
                role="option"
                aria-selected={String(option.value) === normalizedValue}
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
                className={`dropdown-item ${String(option.value) === normalizedValue ? 'selected' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
