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
    const rangeWithDots: (number | string)[] = [];

    range.push(1);
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if(totalPages > 1) range.push(totalPages);

    let l: number | null = null;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-arrow"
      >
        <ChevronLeft size={16} />
      </button>

      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={typeof page !== 'number'}
          className={`pagination-button ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-arrow"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
