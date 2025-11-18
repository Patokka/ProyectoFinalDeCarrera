'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import Pagination from '@/components/ui/Pagination';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ArrendadorDtoOut, ArrendamientoDtoOut } from '@/lib/type';
import { deleteArrendamiento, fetchArrendamientos } from '@/lib/arrendamientos/auth';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { canEditOrDelete, getEstadoBadgeColor } from '@/lib/helpers';
import { useAuth } from '@/components/context/AuthContext';


/**
 * @constant tipoOptions
 * @description Opciones para el filtro de tipo de arrendamiento.
 */
const tipoOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'FIJO', label: 'FIJO' },
  { value: 'A_PORCENTAJE', label: 'APARCERIA (A PORCENTAJE)' }
];

/**
 * @constant estadoOptions
 * @description Opciones para el filtro de estado de arrendamiento.
 */
const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'FINALIZADO', label: 'FINALIZADO' },
  { value: 'VENCIDO', label: 'VENCIDO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

const ITEMS_PER_PAGE = 8;

/**
 * @page ArrendamientosPage
 * @description Página principal para la gestión de arrendamientos. Muestra una lista paginada
 *              y filtrable de arrendamientos, permitiendo crear, ver y eliminar registros.
 * @returns {JSX.Element} La página de gestión de arrendamientos.
 */
export default function ArrendamientosPage() {
  const [arrendamientos, setArrendamientos] = useState<ArrendamientoDtoOut[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);

  /**
   * @effect
   * @description Carga la lista inicial de arrendamientos desde la API al montar el componente.
   */
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

  /**
   * @memo filteredData
   * @description Memoriza la lista de arrendamientos filtrada según los filtros aplicados.
   */
  const filteredData = useMemo(() => {
    return arrendamientos.filter(item => {
      const matchesSearch = item.arrendatario.razon_social.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = !tipoFilter || item.tipo === tipoFilter;
      const matchesEstado = !estadoFilter || item.estado === estadoFilter;
      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [arrendamientos, searchTerm, tipoFilter, estadoFilter]);

  /**
   * @memo paginatedData
   * @description Memoriza la porción de datos a mostrar en la página actual de la tabla.
   */
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  /**
   * @effect
   * @description Reinicia la paginación a la primera página cada vez que cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tipoFilter, estadoFilter]);

  /**
   * @function handleDelete
   * @description Muestra una confirmación y, si es aceptada, elimina un arrendamiento.
   * @param {number} id - El ID del arrendamiento a eliminar.
   */
  const handleDelete = (id: number) => {
      const confirmToastId = toast.info(
        "¿Está seguro que desea eliminar este arrendamiento?",
        {
          action: {
            label: "Confirmar",
            onClick: () => {
              toast.dismiss(confirmToastId);
              const deletePromise = deleteArrendamiento(id);
              toast.promise(deletePromise, {
                  loading: "Eliminando arrendamiento...",
                  success: "Arrendamiento eliminado con éxito",
                  error: (err) => err.message || "Error al eliminar",
                });
              deletePromise.then(() => {
                setTimeout(() => {window.location.reload();}, 1500); 
              }).catch(() => {});
            },
          },
          duration: 5000,
        }
      );
    };


  return (
    <ProtectedRoute>
      {/* ... (resto del JSX sin cambios) */}
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Arrendamientos</h1>
            <Link href="/arrendamientos/post" passHref>
              <button className={`btn-primary ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}>
                <Plus size={16} /><span>Nuevo Arrendamiento</span>
              </button>
            </Link>
          </div>

          <div className="bg-slate-100 rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectFilter options={tipoOptions} value={tipoFilter} onChange={setTipoFilter} label="Tipo de Arrendamiento" />
              <SelectFilter options={estadoOptions} value={estadoFilter} onChange={setEstadoFilter} label="Estado de Arrendamiento" />
              <SearchInput placeholder="Buscar por arrendatario..." value={searchTerm} onChange={setSearchTerm} label="Arrendatario" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron arrendamientos.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="th-class">Número</th>
                      <th className="th-class">Tipo</th>
                      <th className="th-class">Estado</th>
                      <th className="th-class">Arrendatario</th>
                      <th className="th-class">Arrendador(es)</th>
                      <th className="th-class">Hectáreas</th>
                      <th className="th-class">Quintales</th>
                      <th className="th-class">Fecha Fin</th>
                      <th className="th-class">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {paginatedData.map((arrendamiento) => (
                      <tr key={arrendamiento.id} className="hover:bg-gray-50">
                        <td className="td-class">{arrendamiento.id}</td>
                        <td className="td-class">{arrendamiento.tipo.replace("_", " ")}</td>
                        <td className="td-class"><span className={`badge ${getEstadoBadgeColor(arrendamiento.estado)}`}>{arrendamiento.estado}</span></td>
                        <td className="td-class">{arrendamiento.arrendatario.razon_social}</td>
                        <td className="td-class max-w-xs truncate">{arrendamiento.arrendadores?.map((a: ArrendadorDtoOut) => a.nombre_o_razon_social).join(" - ")}</td>
                        <td className="td-class">{arrendamiento.hectareas} ha</td>
                        <td className="td-class">{arrendamiento.quintales} qq</td>
                        <td className="td-class">{format(parseISO(arrendamiento.fecha_fin),'dd/MM/yyyy')}</td>
                        <td className="td-class">
                            <div className="flex space-x-2">
                              <Link href={`/arrendamientos/${arrendamiento.id}`}><button className="btn-icon-blue"><Eye size={16} /></button></Link>
                              <button onClick={() => handleDelete(arrendamiento.id)} className={`btn-icon-red ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}><Trash2 size={16} /></button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
    </ProtectedRoute>
  );
}
