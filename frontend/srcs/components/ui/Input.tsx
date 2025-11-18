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
export default function Input({value, onChange, placeholder, label, error}:InputProps){
    return(
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`input-field ${error ? 'error' : ''}`}
            />
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}
