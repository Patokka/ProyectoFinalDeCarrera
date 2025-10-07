'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Settings } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { RetencionDtoOut } from '@/lib/type';
import { formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import { toast } from 'sonner';
import { fetchRetenciones } from '@/lib/retenciones/auth';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MontoImponibleModal from '@/components/ui/MontoImponibleModal';


const ITEMS_PER_PAGE = 8;

export default function RetencionesPage() {
  const [retenciones, setRetenciones] = useState<RetencionDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMontoImponibleModalOpen, setIsMontoImponibleModalOpen] = useState(false);
  const [searchTermArrendador, setSearchTermArrendador] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return retenciones.filter(item => {
      const matchesArrendador = item.arrendador.nombre_o_razon_social
        .toLowerCase()
        .includes(searchTermArrendador.toLowerCase());
      
      const fechaRetencion = new Date(item.fecha_retencion);
      const matchesFechaDesde = !fechaDesde || fechaRetencion >= new Date(fechaDesde);
      const matchesFechaHasta = !fechaHasta || fechaRetencion <= new Date(fechaHasta);

      return matchesArrendador && matchesFechaDesde && matchesFechaHasta;
    });
  }, [retenciones, searchTermArrendador, fechaDesde, fechaHasta]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermArrendador, fechaDesde, fechaHasta]);

  useEffect(()=> {
    const loadRetenciones = async () =>{
      try{
        setLoading(true);
        const dataRetenciones = await fetchRetenciones();
        setRetenciones(dataRetenciones);
      }catch(e){
        toast.error("Error al cargar las retenciones");
        setError("Error al cargar las retenciones");
      }finally{
        setLoading(false);
      }
    }
    loadRetenciones();
  },[]);


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Retenciones</h1>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput
                placeholder="Buscar..."
                value={searchTermArrendador}
                onChange={setSearchTermArrendador}
                label="Arrendador"
              />
              <DateInput
                value={fechaDesde}
                onChange={setFechaDesde}
                label="Desde"
                placeholder="Seleccionar fecha"
              />
              <DateInput
                value={fechaHasta}
                onChange={setFechaHasta}
                label="Hasta"
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No se encontraron retenciones que coincidan con los filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Fecha Retención
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Facturación Asociada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Monto Imponible
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Monto Retención
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((retencion) => (
                      <tr key={retencion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {retencion.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(retencion.fecha_retencion)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate">{retencion.arrendador.nombre_o_razon_social}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hover:text-blue-500 hover:underline">
                          <Link href = {`/facturaciones/${retencion.facturacion.id}`} passHref>
                            {retencion.facturacion.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(retencion.monto_imponible)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(retencion.total_retencion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación y botones */}
          <div className="mt-6 flex justify-between items-center">
            <Link href="/dashboard" passHref>
              <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                Volver
              </button>
            </Link>
            
            
            <button onClick={() => setIsMontoImponibleModalOpen(true)} className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
            <Settings className="h-4 w-4 mr-1" />
              Configuración Monto Imponible
            </button>
            
            {totalPages > 1 && (
              <div className="flex-1 flex justify-center mx-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <MontoImponibleModal
        isOpen={isMontoImponibleModalOpen}
        onClose={() => setIsMontoImponibleModalOpen(false)}
        onSuccess={() => {
          setIsMontoImponibleModalOpen(false);
        }}
      />
    </ProtectedRoute>
  );
}