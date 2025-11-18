'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Plus, FileText, Calculator, Edit } from 'lucide-react';
import SelectFilter from '@/components/ui/SelectFilter';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { facturarPagos, fetchPagos } from '@/lib/pagos/auth';
import { PagoDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, getPagoBadgeColor } from '@/lib/helpers';
import PagoParticularModal from '@/components/ui/PagoParticularModal';
import AsignarPrecioModal from '@/components/ui/AsignarPrecioPagoModal';
import { useAuth } from '@/components/context/AuthContext';
import EditPagoModal from '@/components/ui/EditPagoModal';

const ITEMS_PER_PAGE = 7;

/**
 * @page PagosPage
 * @description Página principal para la gestión de pagos. Muestra una lista paginada
 *              y filtrable de todos los pagos, permitiendo crear, editar, y facturar.
 * @returns {JSX.Element} La página de gestión de pagos.
 */
export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoDtoOut[]>([]);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPagos, setSelectedPagos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isAsignarPrecioPagoModalOpen, setIsAsignarPrecioPagoModalOpen] = useState(false);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoDtoOut | null>(null);
  
  /**
   * @function loadPagos
   * @description Carga o recarga la lista de pagos desde la API.
   */
  const loadPagos = async () => {
    try {
      setLoading(true);
      const data = await fetchPagos();
      setPagos(data);
    } catch (e) {
      toast.error("Error al cargar los pagos");
      setError("Error al cargar los pagos");
    } finally {
        setLoading(false);
      }
    };

  /**
   * @effect
   * @description Carga inicial de los pagos.
   */
  useEffect(() => {
    loadPagos();
  }, []);

  /**
   * @memo filteredData
   * @description Memoriza la lista de pagos filtrada por estado y fecha.
   */
  const filteredData = useMemo(() => {
    return pagos.filter(item => {
      const fecha = new Date(item.vencimiento);
      return (!estadoFilter || item.estado === estadoFilter) &&
             (!fechaDesde || fecha >= new Date(fechaDesde)) &&
             (!fechaHasta || fecha <= new Date(fechaHasta));
    });
  }, [pagos, estadoFilter, fechaDesde, fechaHasta]);

  /**
   * @memo paginatedData
   * @description Memoriza la porción de datos para la página actual.
   */
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  /**
   * @effect
   * @description Resetea la página al cambiar filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFilter, fechaDesde, fechaHasta]);

  /**
   * @function handleSelectPago
   * @description Maneja la selección/deselección de un pago.
   */
  const handleSelectPago = (pagoId: number) => {
    setSelectedPagos(prev => prev.includes(pagoId) ? prev.filter(id => id !== pagoId) : [...prev, pagoId]);
  };

  /**
   * @function handleSelectAll
   * @description Selecciona/deselecciona todos los pagos facturables en la página actual.
   */
  const handleSelectAll = () => {
    const facturables = paginatedData.filter(p => (p.estado === "PENDIENTE" && p.precio_promedio) || p.estado === "VENCIDO").map(p => p.id);
    const allSelected = facturables.every(id => selectedPagos.includes(id));
    setSelectedPagos(allSelected ? prev => prev.filter(id => !facturables.includes(id)) : prev => [...new Set([...prev, ...facturables])]);
  };

  /**
   * @function handleFacturarSeleccionados
   * @description Confirma y ejecuta la facturación de los pagos seleccionados.
   */
  const handleFacturarSeleccionados = () => {
    toast.info(`¿Facturar ${selectedPagos.length} pago(s)?`, {
      action: {
        label: "Confirmar",
        onClick: () => {
          toast.promise(facturarPagos(selectedPagos), {
            loading: "Facturando...",
            success: () => {
              loadPagos();
              setSelectedPagos([]);
              return "Facturaciones realizadas con éxito.";
            },
            error: (err) => err.message || "Error al facturar",
          });
        },
      },
      duration: 5000,
    });
  };

  const allCurrentPageSelected = paginatedData.length > 0 && paginatedData.filter(p => (p.estado === "PENDIENTE" && p.precio_promedio) || p.estado === "VENCIDO").every(p => selectedPagos.includes(p.id));

  return (
    <ProtectedRoute>
      {/* ... (resto del JSX sin cambios) */}
    </ProtectedRoute>
  );
}
