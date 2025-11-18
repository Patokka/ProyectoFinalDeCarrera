'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, Settings } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { RetencionDtoOut } from '@/lib/type';
import { formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, canEditOrDelete } from '@/lib/helpers';
import { toast } from 'sonner';
import { fetchRetenciones } from '@/lib/retenciones/auth';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MinimoImponibleModal from '@/components/ui/MinimoImponibleModal';
import EditRetencionModal from '@/components/ui/EditRetencionModal';
import { useAuth } from '@/components/context/AuthContext';

const ITEMS_PER_PAGE = 8;

/**
 * @page RetencionesPage
 * @description Página principal para la gestión de retenciones. Muestra una lista paginada
 *              y filtrable de todas las retenciones, y permite configurar el mínimo imponible.
 * @returns {JSX.Element} La página de gestión de retenciones.
 */
export default function RetencionesPage() {
  const [retenciones, setRetenciones] = useState<RetencionDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimoImponibleModalOpen, setIsMinimoImponibleModalOpen] = useState(false);
  const [searchTermArrendador, setSearchTermArrendador] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditRetencionModalOpen, setIsEditRetencionModalOpen] = useState(false);
  const [selectedRetencion, setSelectedRetencion] = useState<RetencionDtoOut | null>(null);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);

  /**
   * @function loadRetenciones
   * @description Carga o recarga la lista de retenciones desde la API.
   */
  const loadRetenciones = async () =>{
    try{
      setLoading(true);
      setRetenciones(await fetchRetenciones());
    }catch(e){
      toast.error("Error al cargar las retenciones");
      setError("Error al cargar las retenciones");
    }finally{
      setLoading(false);
    }
  }

  /**
   * @effect
   * @description Carga inicial de las retenciones.
   */
  useEffect(()=> {
    loadRetenciones();
  },[]);

  /**
   * @memo filteredData
   * @description Memoriza la lista de retenciones filtrada por arrendador y fecha.
   */
  const filteredData = useMemo(() => {
    return retenciones.filter(item => {
      const fechaRetencion = new Date(item.fecha_retencion);
      return item.arrendador.nombre_o_razon_social.toLowerCase().includes(searchTermArrendador.toLowerCase()) &&
             (!fechaDesde || fechaRetencion >= new Date(fechaDesde)) &&
             (!fechaHasta || fechaRetencion <= new Date(fechaHasta));
    });
  }, [retenciones, searchTermArrendador, fechaDesde, fechaHasta]);

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
   * @description Resetea la paginación cuando cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermArrendador, fechaDesde, fechaHasta]);

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Retenciones</h1>
          </div>

          <div className="bg-slate-100 rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-sm font-medium mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput label="Arrendador" value={searchTermArrendador} onChange={setSearchTermArrendador} />
              <DateInput label="Desde" value={fechaDesde} onChange={setFechaDesde} />
              <DateInput label="Hasta" value={fechaHasta} onChange={setFechaHasta} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* ... (renderizado condicional de tabla, loading, error) ... */}
          </div>

          <div className="mt-6 grid grid-cols-3 items-center">  
            <div className="justify-self-start">
              <Link href="/dashboard"><button className="btn-secondary">Volver</button></Link>
            </div>
            <div className="justify-self-center">
              {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>
            <div className="justify-self-end">
              <button onClick={() => setIsMinimoImponibleModalOpen(true)} className="btn-primary">
                <Settings size={16} />Configuración Mínimo Imponible
              </button>
            </div>
          </div>
        </div>
      </div>
      <MinimoImponibleModal isOpen={isMinimoImponibleModalOpen} onClose={() => setIsMinimoImponibleModalOpen(false)} onSuccess={() => setIsMinimoImponibleModalOpen(false)} />
      {selectedRetencion && <EditRetencionModal isOpen={isEditRetencionModalOpen} onClose={() => setIsEditRetencionModalOpen(false)} onSuccess={() => { setIsEditRetencionModalOpen(false); loadRetenciones(); }} retencion={selectedRetencion} />}
    </ProtectedRoute>
  );
}
