import { Option } from "@/lib/type";
import { useEffect, useState, useRef } from "react";

/**
 * @interface ArrendadorSelectProps
 * @description Propiedades para el componente ArrendadorSelect.
 * @property {Option[]} arrendadores - La lista completa de arrendadores para seleccionar.
 * @property {string | number} [value] - El ID del arrendador actualmente seleccionado.
 * @property {(arrendador: string) => void} onSelect - Función callback que se ejecuta al seleccionar un arrendador.
 * @property {string} label - La etiqueta a mostrar encima del campo de selección.
 * @property {string} [placeholder] - El texto a mostrar en el campo de búsqueda.
 */
interface ArrendadorSelectProps {
  arrendadores: Option[];
  value?: string | number;
  onSelect: (arrendador: string) => void;
  label: string;
  placeholder?: string;
}

/**
 * @component ArrendadorSelect
 * @description Un componente de selección con búsqueda para encontrar y seleccionar
 *              un arrendador de una lista.
 * @param {ArrendadorSelectProps} props - Las propiedades del componente.
 * @returns {JSX.Element} El componente de selección de arrendador.
 */
export const ArrendadorSelect: React.FC<ArrendadorSelectProps> = ({ arrendadores, value, onSelect, label, placeholder = "Buscar arrendador..."}) => {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Option[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * @effect
   * @description Filtra la lista de arrendadores cada vez que cambia el término de búsqueda.
   */
  useEffect(() => {
    setFiltered(
      arrendadores.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase())
      )
    );
    setShowDropdown(query.length > 0);
  }, [query, arrendadores]);

  /**
   * @effect
   * @description Cierra el menú desplegable si se hace clic fuera del componente.
   */
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
        className={`w-full px-3 py-2 text-sm rounded-md shadow-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
              className={`${a.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}  px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer`}
            >
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
