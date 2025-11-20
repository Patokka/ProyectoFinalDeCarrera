/**
 * @interface InputProps
 * @description Propiedades para el componente Input.
 * @property {string} value - El valor actual del campo de texto.
 * @property {string} placeholder - El texto a mostrar cuando el campo está vacío.
 * @property {(value: string) => void} onChange - Función callback que se ejecuta cuando el valor cambia.
 * @property {string} label - La etiqueta a mostrar encima del campo.
 * @property {string} [error] - Mensaje de error a mostrar si la validación falla.
 */
interface InputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    error?: string;
}

/**
 * @component Input
 * @description Un componente de campo de texto genérico y reutilizable con etiqueta y manejo de errores.
 * @param {InputProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de entrada de texto.
 */
export default function Input({value, onChange, placeholder, label, error,}:InputProps){

    return(
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
            <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${error ? "border-red-600 focus:ring-red-500 focus:border-red-500" : "border-gray-300  focus:ring-blue-500 focus:border-blue-500"}` }
            />
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
}