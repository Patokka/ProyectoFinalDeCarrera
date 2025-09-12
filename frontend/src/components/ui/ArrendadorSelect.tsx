import { useEffect, useState, useRef } from "react";

interface Arrendador {
  id: string;
  nombre: string;
  hectareas: number;
  quintales: number;
}

interface ArrendadorSelectProps {
  arrendadores: Arrendador[];
  value?: Arrendador;
  onSelect: (arrendador: Arrendador) => void;
  label: string;
  placeholder?: string;
}

export const ArrendadorSelect: React.FC<ArrendadorSelectProps> = ({
  arrendadores,
  value,
  onSelect,
  label,
  placeholder = "Buscar arrendador..."
}) => {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Arrendador[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiltered(
      arrendadores.filter(a =>
        a.nombre.toLowerCase().includes(query.toLowerCase())
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
              key={a.id}
              onMouseDown={(e) => {
                e.preventDefault(); // Evita que el input reciba foco de nuevo
                onSelect(a);
                setQuery(a.nombre);
                setShowDropdown(false);
                inputRef.current?.blur(); // Quita el foco del input
              }}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {a.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
