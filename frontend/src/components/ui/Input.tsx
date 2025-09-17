interface InputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    error?: string;
}


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