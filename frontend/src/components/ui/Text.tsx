import React from "react";

/**
 * @interface TextProps
 * @description Propiedades para el componente Text.
 * @property {string} label - La etiqueta a mostrar sobre el campo.
 * @property {string} value - El valor a mostrar en el campo.
 * @property {boolean} [disabled] - Si el campo está deshabilitado.
 * @property {boolean} [readOnly] - Si el campo es de solo lectura.
 */
interface TextProps {
  label: string;
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * @component Text
 * @description Un componente para mostrar un campo de texto de solo lectura,
 *              ideal para presentar información que no debe ser editada por el usuario.
 * @param {TextProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de texto de solo lectura.
 */
export default function Text({ label, value, disabled = true, readOnly=true, }: TextProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                    hover:cursor-not-allowed"
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}
