/**
 * @interface NumberInputProps
 * @description Propiedades para el componente NumberInput.
 * @property {string} label - La etiqueta a mostrar encima del campo.
 * @property {number | undefined} value - El valor numérico actual del campo.
 * @property {(value: number | undefined) => void} onChange - Callback que se ejecuta cuando el valor cambia.
 * @property {string} [placeholder] - Texto a mostrar cuando el campo está vacío.
 * @property {number} [min] - Valor mínimo permitido.
 * @property {number} [max] - Valor máximo permitido.
 * @property {number} [step] - Incremento para las flechas del input.
 * @property {string} [className] - Clases CSS adicionales.
 * @property {string} [error] - Mensaje de error a mostrar.
 */
interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string | "";
  error?: string;
}

/**
 * @component NumberInput
 * @description Un componente reutilizable para la entrada de números, con validación
 *              para prevenir caracteres no numéricos y manejo de errores.
 * @param {NumberInputProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El campo de entrada numérica.
 */
export const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, placeholder, min, max, step = 0.5, className="", error}) => {
  return (
    <div className={`relative ${className}`}>
      <h6 className="text-sm font-medium text-gray-700 mb-1">{label}:</h6>
      <input
        type="number"
        value={value !== undefined ? value.toString() : ""}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
        onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`input-field ${error ? 'error' : ''}`}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}
