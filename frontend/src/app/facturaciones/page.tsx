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
  
  // Filtrar datos
  const filteredData = useMemo(() => {
    return facturaciones.filter(item => {
      const matchesArrendador = item.arrendador.nombre_o_razon_social
        .toLowerCase()
        .includes(searchTermArrendador.toLowerCase());
      
      const fechaRetencion = new Date(item.fecha_facturacion);
      const matchesFechaDesde = !fechaDesde || fechaRetencion >= new Date(fechaDesde);
      const matchesFechaHasta = !fechaHasta || fechaRetencion <= new Date(fechaHasta);

      return matchesArrendador && matchesFechaDesde && matchesFechaHasta;
    });
  }, [facturaciones, searchTermArrendador, fechaDesde, fechaHasta]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermArrendador, fechaDesde, fechaHasta]);

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

  useEffect(()=> {
    loadFacturaciones();
  },[]);


  return (
    <ProtectedRoute>  
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Facturaciones</h1>
            <button onClick={() => setIsFacturacionModalOpen(true)} className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
                    disabled={!canEditEliminate}>
              <Plus className="h-4 w-4" />
              <span>Nueva Facturación</span>
            </button>
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
                No se encontraron facturaciones que coincidan con los filtros.
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
                        Fecha Facturación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Pago Facturado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Monto Factuado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((facturacion) => (
                      <tr key={facturacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facturacion.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(facturacion.fecha_facturacion)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate">{facturacion.arrendador.nombre_o_razon_social}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hover:text-blue-500 hover:underline">
                          <Link href={`pagos/${facturacion.pago.id}`} passHref>
                            {facturacion.pago.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {facturacion.tipo_factura}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(facturacion.monto_facturacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href = {`/facturaciones/${facturacion.id}`} passHref>
                              <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedFacturacion(facturacion);
                                setIsEditFacturacionModalOpen(true);}}
                              className={`p-1 rounded transition-colors ${canEditEliminate ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 cursor-pointer": "text-gray-400  cursor-not-allowed"}`} title="Editar"
                              disabled={!canEditEliminate}
                            >
                            <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginación y botones */}
          <div className="mt-6 grid grid-cols-3 items-center">            
            <div className="justify-self-start">
              <Link href="/dashboard" passHref> 
                <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                  Volver
                </button>
              </Link>
            </div>
            <div className="justify-self-center">
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
            <div></div>
          </div>
        </div>
      </div>
      <FacturacionModal
        isOpen={isFacturacionModalOpen}
        onClose={() => setIsFacturacionModalOpen(false)}
        onSuccess={() => {
          setIsFacturacionModalOpen(false);
          loadFacturaciones();
          window.location.reload();
        }}
      />
      <EditFacturacionModal
        isOpen={isEditFacturacionModalOpen}
        onClose={() => setIsEditFacturacionModalOpen(false)}
        onSuccess={() => {
            setIsEditFacturacionModalOpen(false);
            loadFacturaciones();
        }}
        factura={selectedFacturacion}
      />
    </ProtectedRoute>
  );
}