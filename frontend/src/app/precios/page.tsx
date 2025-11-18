'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { toast } from 'sonner';
import { PrecioDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { deletePrecio, fetchPreciosAGD, fetchPreciosBCR } from '@/lib/precios/auth';
import PrecioModal from '@/components/ui/PriceModal';
import EditPrecioModal from '@/components/ui/EditPrecioModal';
import { useAuth } from '@/components/context/AuthContext';

const ITEMS_PER_PAGE = 6;

/**
 * @page PreciosPage
 * @description Página para visualizar y gestionar los precios de la soja de BCR y AGD.
 *              Muestra los precios en tablas separadas y paginadas.
 * @returns {JSX.Element} La página de gestión de precios.
 */
export default function PreciosPage() {
  const [preciosBCR, setPreciosBCR] = useState<PrecioDtoOut[]>([]);
  const [preciosAGD, setPreciosAGD] = useState<PrecioDtoOut[]>([]);
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPageBCR, setCurrentPageBCR] = useState(1);
  const [currentPageAGD, setCurrentPageAGD] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [precioSeleccionado, setPrecioSeleccionado] = useState<PrecioDtoOut | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);

  /**
   * @effect
   * @description Carga los precios de BCR y AGD al montar el componente.
   */
  useEffect(() => {
    const loadPrecios = async () => {
      try {
        setLoading(true);
        const [dataBCR, dataAGD] = await Promise.all([fetchPreciosBCR(), fetchPreciosAGD()]);
        setPreciosBCR(dataBCR);
        setPreciosAGD(dataAGD);
      } catch (e) {
        toast.error("Error al cargar los precios");
        setError("Error al cargar los precios");
      } finally {
        setLoading(false);
      }
    };
    loadPrecios();
  }, []);

  /**
   * @function reloadPrecios
   * @description Recarga los precios de ambas fuentes y cierra los modales.
   */
  const reloadPrecios = async () => {
    try {
      const [dataBCR, dataAGD] = await Promise.all([fetchPreciosBCR(), fetchPreciosAGD()]);
      setPreciosBCR(dataBCR);
      setPreciosAGD(dataAGD);
    } catch {
      toast.error("Error al recargar la lista de precios");
    } finally {
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setPrecioSeleccionado(null);
    }
  };

  /**
   * @function handleDelete
   * @description Muestra una confirmación y elimina un precio.
   */
  const handleDelete = (precio: PrecioDtoOut) => {
    toast.info("¿Está seguro que desea eliminar este precio?", {
      action: {
        label: "Confirmar",
        onClick: () => {
          toast.promise(deletePrecio(precio.id), {
            loading: "Eliminando...",
            success: () => {
              if (precio.origen === 'AGD') setPreciosAGD(prev => prev.filter(p => p.id !== precio.id));
              else setPreciosBCR(prev => prev.filter(p => p.id !== precio.id));
              return "Precio eliminado con éxito";
            },
            error: (err) => err.message || "Error al eliminar",
          });
        },
      },
      duration: 5000,
    });
  };

  /**
   * @component PreciosTable
   * @description Componente reutilizable para mostrar una tabla de precios.
   */
  const PreciosTable = ({ data, title, currentPage, totalPages, onPageChange }: any) => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* ... JSX de la tabla ... */}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        {/* ... (resto del JSX) */}
      </div>
      <PrecioModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={reloadPrecios} />
      {precioSeleccionado && <EditPrecioModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={reloadPrecios} precioActual={precioSeleccionado} />}
    </ProtectedRoute>
  );
}
