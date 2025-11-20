'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @interface PaginationProps
 * @description Propiedades para el componente Pagination.
 * @property {number} currentPage - El número de la página actual.
 * @property {number} totalPages - El número total de páginas.
 * @property {(page: number) => void} onPageChange - Función callback que se ejecuta al cambiar de página.
 * @property {string} [className] - Clases CSS adicionales para el contenedor.
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * @component Pagination
 * @description Un componente de paginación reutilizable que muestra los controles
 *              para navegar entre páginas. Incluye lógica para mostrar un número
 *              limitado de páginas y elipsis.
 * @param {PaginationProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El componente de paginación o `null` si solo hay una página.
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  /**
   * @function getVisiblePages
   * @description Calcula qué números de página deben ser visibles en la barra de paginación
   *              para evitar mostrar demasiados números a la vez.
   * @returns {(number | string)[]} Un array con los números de página y elipsis.
   */
    const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={typeof page !== 'number'}
          className={`px-3 py-2 rounded-md border text-sm font-medium ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : typeof page === 'number'
              ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              : 'bg-white text-gray-400 border-gray-300 cursor-default'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}