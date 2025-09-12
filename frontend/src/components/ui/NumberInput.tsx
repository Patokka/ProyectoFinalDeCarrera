interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string | "";
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, placeholder, min, max, step = 0.5, className="",
}) => {
  return (
    <div className={`relative ${className}`}>
      <h6 className="text-sm font-medium text-gray-700 mb-1">{label}:</h6>
      <input
        type="number"
        value={value !== undefined ? value.toString() : ""}
        onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : undefined)
        }
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}