"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    error?: string;
}

export default function PasswordInput({value,onChange,placeholder,label,error,}: PasswordInputProps) {
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
                    className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 pr-10 ${error? "border-red-600 focus:ring-red-500 focus:border-red-500": "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
                    tabIndex={-1}
                >
                    {showPassword ? (<EyeOff className="h-4 w-4 text-gray-400" />) : (<Eye className="h-4 w-4 text-gray-400" />)}
                </button>
            </div>
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
}
