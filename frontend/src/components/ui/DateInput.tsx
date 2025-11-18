'use client';

import { useRef } from 'react';

/**
 * @interface DateInputProps
 * @description Propiedades para el componente DateInput.
 * @property {string} value - El valor actual de la fecha (en formato 'YYYY-MM-DD').
 * @property {(value: string) => void} onChange - Función callback que se ejecuta cuando cambia la fecha.
 * @property {string} label - La etiqueta a mostrar encima del campo.
 * @property {string} [placeholder] - Texto placeholder para el campo.
 * @property {string} [className] - Clases CSS adicionales.
 * @property {boolean} [disabled] - Si el campo debe estar deshabilitado.
 * @property {string} [error] - Mensaje de error a mostrar debajo del campo.
 */
interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * @component DateInput
 * @description Un componente reutilizable para la entrada de fechas.
 * @param {DateInputProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de entrada de fecha.
 */
export default function DateInput({ value, onChange, label, placeholder = '', className = '', disabled = false, error}: DateInputProps) {
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
          className={`input-field ${error ? "error" : ""}`}
        />
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
