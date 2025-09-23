import React from "react";

interface TextProps {
  label: string;
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
}

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
