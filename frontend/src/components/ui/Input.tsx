
interface InputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
}


export default function Input({value, onChange, placeholder, label}:InputProps){

    return(
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
            <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
        </div>
    );
}