'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import Pagination from '@/components/ui/Pagination';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ArrendadorDtoOut, ArrendamientoDtoOut } from '@/lib/type';
import { deleteArrendamiento, fetchArrendamientos } from '@/lib/arrendamientos/auth';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { getEstadoBadgeColor } from '@/lib/helpers';


// Opciones para los filtros
const tipoOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'FIJO', label: 'FIJO' },
  { value: 'A_PORCENTAJE', label: 'APARCERIA (A PORCENTAJE)' }
];

const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'FINALIZADO', label: 'FINALIZADO' },
  { value: 'VENCIDO', label: 'VENCIDO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

const ITEMS_PER_PAGE = 8;

export default function ArrendamientosPage() {
  const [arrendamientos, setArrendamientos] = useState<ArrendamientoDtoOut[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Traer los arrendamientos del backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchArrendamientos();
        setArrendamientos(data);
      } catch (err) {
        toast.error("Error al cargar los arrendamientos");
        setError("Error al cargar los arrendamientos")
      } finally{
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return arrendamientos.filter(item => {
      const matchesSearch = item.arrendatario.razon_social
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTipo = !tipoFilter || item.tipo === tipoFilter;
      const matchesEstado = !estadoFilter || item.estado === estadoFilter;
      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [arrendamientos, searchTerm, tipoFilter, estadoFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tipoFilter, estadoFilter]);

  const handleDelete = (id: number) => {
    // Confirmación
    const confirmToastId = toast.info(
      "¿Está seguro que desea eliminar este arrendamiento?",
      {
        action: {
          label: "Confirmar",
          onClick: () => {
            toast.dismiss(confirmToastId);
            
            //Delete
            toast.promise(
              deleteArrendamiento(id).then(() => {
                setArrendamientos(prev =>
                  prev.filter((item) => item.id !== id)
                );
              }),
              {
                loading: "Eliminando arrendamiento...",
                success: "Arrendamiento eliminado con éxito",
                error: (err) => err.message || "Error al eliminar el arrendamiento",
              }
            );
          },
        },
        duration: 5000, // 5 segundos
      }
    );
  };


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Arrendamientos</h1>
              </div>
              <Link href = "/arrendamientos/post" passHref> 
                <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Arrendamiento</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectFilter
                options={tipoOptions}
                value={tipoFilter}
                onChange={setTipoFilter}
                placeholder="ej: FIJO"
                label="Tipo de Arrendamiento"
              />
              <SelectFilter
                options={estadoOptions}
                value={estadoFilter}
                onChange={setEstadoFilter}
                placeholder="ej: ACTIVO"
                label="Estado de Arrendamiento"
              />
              <SearchInput
                placeholder="Buscar..."
                value={searchTerm}
                onChange={setSearchTerm}
                label="Arrendatario"
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
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendatario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador(es)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Hectáreas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Quintales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Fecha Finalización
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((arrendamiento) => (
                      <tr key={arrendamiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendamiento.id}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {arrendamiento.tipo.replace("_", " ")}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(arrendamiento.estado)}`}>
                            {arrendamiento.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendamiento.arrendatario.razon_social}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {arrendamiento.arrendadores?.map((a: ArrendadorDtoOut) => a.nombre_o_razon_social).join(" - ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendamiento.hectareas + ' ha'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendamiento.quintales + ' qq'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(parseISO(arrendamiento.fecha_fin),'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link href = {`/arrendamientos/${arrendamiento.id}`}>
                                <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </Link>
                              <button onClick={() => handleDelete(arrendamiento.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                <Trash2 className="h-4 w-4" />
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

          {/* Paginación y botón volver*/}

            <div className="mt-6 flex justify-between">
              <Link href="/dashboard" passHref> 
                <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                  Volver
                </button>
              </Link>
              {totalPages > 1 && (
                <div className="flex-1 flex justify-center">
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
    </ProtectedRoute>
  );
}