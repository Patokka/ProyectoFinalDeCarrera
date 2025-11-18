"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * @interface PasswordInputProps
 * @description Propiedades para el componente PasswordInput.
 * @property {string} value - El valor actual del campo.
 * @property {string} placeholder - El texto placeholder.
 * @property {(value: string) => void} onChange - Callback que se ejecuta al cambiar el valor.
 * @property {string} label - La etiqueta a mostrar sobre el campo.
 * @property {string} [error] - Mensaje de error a mostrar.
 */
interface PasswordInputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    error?: string;
}

/**
 * @component PasswordInput
 * @description Un componente de entrada de contraseña con un botón para
 *              mostrar u ocultar el valor.
 * @param {PasswordInputProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de entrada de contraseña.
 */
export default function PasswordInput({value,onChange,placeholder,label,error}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}:
            </label>
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`input-field pr-10 ${error ? 'error' : ''}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}
