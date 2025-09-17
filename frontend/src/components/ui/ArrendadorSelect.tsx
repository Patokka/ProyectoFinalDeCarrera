import { Option } from "@/lib/type";
import { useEffect, useState, useRef } from "react";

interface ArrendadorSelectProps {
  arrendadores: Option[];
  value?: string | number;
  onSelect: (arrendador: string) => void;
  label: string;
  placeholder?: string;
}

export const ArrendadorSelect: React.FC<ArrendadorSelectProps> = ({ arrendadores, value, onSelect, label, placeholder = "Buscar arrendador..."}) => {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Option[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiltered(
      arrendadores.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase())
      )
    );
    setShowDropdown(query.length > 0);
  }, [query, arrendadores]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <h6 className="text-sm font-medium text-gray-700 mb-1">{label}:</h6>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded-md"
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded-md mt-1 max-h-60 overflow-y-auto w-full">
          {filtered.map((a) => (
            <li
              key={a.label}
              onMouseDown={(e) => {
                e.preventDefault(); // Evita que el input reciba foco de nuevo
                onSelect(a.value);
                setQuery(a.label);
                setShowDropdown(false);
                inputRef.current?.blur(); // Quita el foco del input
              }}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
