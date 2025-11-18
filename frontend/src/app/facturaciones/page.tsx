'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { FacturacionDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import { toast } from 'sonner';
import { fetchFacturaciones } from '@/lib/facturaciones/auth';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import FacturacionModal from '@/components/ui/FacturacionModal';
import { useAuth } from '@/components/context/AuthContext';
import EditFacturacionModal from '@/components/ui/EditFacturacionModal';

const ITEMS_PER_PAGE = 8;

/**
 * @page FacturacionesPage
 * @description Página principal para la gestión de facturaciones. Muestra una lista paginada
 *              y filtrable de todas las facturaciones registradas.
 * @returns {JSX.Element} La página de gestión de facturaciones.
 */
export default function FacturacionesPage() {
  const [facturaciones, setFacturaciones] = useState<FacturacionDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFacturacionModalOpen, setIsFacturacionModalOpen] = useState(false);
  const [searchTermArrendador, setSearchTermArrendador] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);
  const [isEditFacturacionModalOpen, setIsEditFacturacionModalOpen] = useState(false);
  const [selectedFacturacion, setSelectedFacturacion] = useState<FacturacionDtoOut | null>(null);
  
  /**
   * @function loadFacturaciones
   * @description Carga o recarga la lista de facturaciones desde la API.
   */
  const loadFacturaciones = async () =>{
    try{
      setLoading(true);
      const dataFacturaciones = await fetchFacturaciones();
      setFacturaciones(dataFacturaciones);
    }catch(e){
      toast.error("Error al cargar las facturaciones");
      setError("Error al cargar las facturaciones");
    }finally{
      setLoading(false);
    }
  };

  /**
   * @effect
   * @description Carga inicial de las facturaciones al montar el componente.
   */
  useEffect(()=> {
    loadFacturaciones();
  },[]);

  /**
   * @memo filteredData
   * @description Memoriza la lista de facturaciones filtrada por arrendador y rango de fechas.
   */
  const filteredData = useMemo(() => {
    return facturaciones.filter(item => {
      const matchesArrendador = item.arrendador.nombre_o_razon_social.toLowerCase().includes(searchTermArrendador.toLowerCase());
      const fechaRetencion = new Date(item.fecha_facturacion);
      const matchesFechaDesde = !fechaDesde || fechaRetencion >= new Date(fechaDesde);
      const matchesFechaHasta = !fechaHasta || fechaRetencion <= new Date(fechaHasta);
      return matchesArrendador && matchesFechaDesde && matchesFechaHasta;
    });
  }, [facturaciones, searchTermArrendador, fechaDesde, fechaHasta]);

  /**
   * @memo paginatedData
   * @description Memoriza la porción de datos a mostrar en la página actual.
   */
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  /**
   * @effect
   * @description Resetea la paginación a la primera página cuando cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermArrendador, fechaDesde, fechaHasta]);

  return (
    <ProtectedRoute>  
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Facturaciones</h1>
            <button onClick={() => setIsFacturacionModalOpen(true)} className={`btn-primary ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}>
              <Plus size={16} /><span>Nueva Facturación</span>
            </button>
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
            {loading && <div className="text-center py-12">Cargando...</div>}
            {error && <div className="text-center py-12 text-red-500 font-semibold">{error}</div>}
            {!loading && !error && filteredData.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron facturaciones.</div>}
            {!loading && !error && filteredData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  {/* ... (thead y tbody sin cambios) */}
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link href="/dashboard"><button className="btn-secondary">Volver</button></Link>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
          </div>
        </div>
      </div>
      <FacturacionModal isOpen={isFacturacionModalOpen} onClose={() => setIsFacturacionModalOpen(false)} onSuccess={() => { setIsFacturacionModalOpen(false); loadFacturaciones(); }} />
      <EditFacturacionModal isOpen={isEditFacturacionModalOpen} onClose={() => setIsEditFacturacionModalOpen(false)} onSuccess={() => { setIsEditFacturacionModalOpen(false); loadFacturaciones(); }} factura={selectedFacturacion} />
    </ProtectedRoute>
  );
}
