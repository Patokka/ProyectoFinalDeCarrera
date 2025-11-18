'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ArrendadorDtoOut } from '@/lib/type';
import { deleteArrendador, fetchArrendadores } from '@/lib/arrendadores/auth';
import { toast } from 'sonner';
import { canEditOrDelete, formatCuit, formatCuitDisplay, getCondicionBadgeColor } from '@/lib/helpers';
import { useAuth } from '@/components/context/AuthContext';

/**
 * @constant condicionFiscalOptions
 * @description Opciones para el filtro de condición fiscal.
 */
const condicionFiscalOptions = [
  { value: '', label: 'Todas las condiciones' },
  { value: 'MONOTRIBUTISTA', label: 'MONOTRIBUTISTA' },
  { value: 'RESPONSABLE_INSCRIPTO', label: 'RESPONSABLE INSCRIPTO' },
  { value: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO', label: 'EXENTO / RESPONSABLE NO INSCRIPTO' }
];

const ITEMS_PER_PAGE = 8;

/**
 * @page ArrendadoresPage
 * @description Página principal para la gestión de arrendadores. Muestra una lista paginada
 *              y filtrable de arrendadores, permitiendo crear, ver, editar y eliminar registros.
 * @returns {JSX.Element} La página de gestión de arrendadores.
 */
export default function ArrendadoresPage() {
  const [arrendadores, setArrendadores] = useState<ArrendadorDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTermNombre, setSearchTermNombre] = useState('');
  const [searchTermCuit, setSearchTermCuit] = useState('');
  const [condicionFilter, setCondicionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);

  /**
   * @effect
   * @description Carga la lista inicial de arrendadores desde la API al montar el componente.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchArrendadores();
        setArrendadores(data);
      } catch (err) {
        setError("No se pudieron cargar los arrendadores");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /**
   * @memo filteredData
   * @description Memoriza la lista de arrendadores filtrada según los términos de búsqueda y filtros aplicados.
   */
  const filteredData = useMemo(() => {
    return arrendadores.filter(item => {
      const matchesNombre = item.nombre_o_razon_social.toLowerCase().includes(searchTermNombre.toLowerCase());
      const matchesCuit = item.cuil.toLowerCase().includes(searchTermCuit.toLowerCase().replace(/-/g,""));
      const matchesCondicion = !condicionFilter || item.condicion_fiscal === condicionFilter;
      return matchesNombre && matchesCuit && matchesCondicion;
    });
  }, [arrendadores, searchTermNombre, searchTermCuit, condicionFilter]);

  /**
   * @memo paginatedData
   * @description Memoriza la porción de datos a mostrar en la página actual de la tabla.
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  /**
   * @effect
   * @description Reinicia la paginación a la primera página cada vez que cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermNombre, searchTermCuit, condicionFilter]);

  /**
   * @function handleDelete
   * @description Muestra una confirmación y, si es aceptada, elimina un arrendador.
   * @param {number} id - El ID del arrendador a eliminar.
   */
  const handleDelete = (id: number) => {
    const confirmToastId = toast.info(
      "¿Está seguro que desea eliminar este arrendador?",
      {
        action: {
          label: "Confirmar",
          onClick: () => {
            toast.dismiss(confirmToastId);
            toast.promise(
              deleteArrendador(id).then(() => {
                setArrendadores(prev => prev.filter((item) => item.id !== id));
              }),
              {
                loading: "Eliminando arrendador...",
                success: "Arrendador eliminado con éxito",
                error: (err) => err.message || "Error al eliminar el arrendador",
              }
            );
          },
        },
        duration: 5000,
      }
    );
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        {/* ... (resto del JSX sin cambios) */}
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Arrendadores</h1>
            <Link href="/arrendadores/post" passHref>
              <button className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
                  disabled={!canEditEliminate}>
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Arrendador</span>
              </button>
            </Link>
          </div>

          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput placeholder="Buscar..." value={searchTermNombre} onChange={setSearchTermNombre} label="Nombre / Razón Social" />
              <SearchInput placeholder="Ej: 99-999999-9" value={formatCuitDisplay(searchTermCuit)} onChange={setSearchTermCuit} label="CUIT-CUIL" />
              <SelectFilter options={condicionFiscalOptions} value={condicionFilter} onChange={setCondicionFilter} placeholder="Ej: MONOTRIBUTISTA" label="Condición Fiscal" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron arrendadores.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre / Razón Social</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">CUIT-CUIL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Condición Fiscal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Localidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((arrendador) => (
                      <tr key={arrendador.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{arrendador.nombre_o_razon_social}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCuit(arrendador.cuil)}</td>
                        <td className="px-6 py-4"><span className={`badge ${getCondicionBadgeColor(arrendador.condicion_fiscal)}`}>{arrendador.condicion_fiscal.replace(/_/g, ' ')}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-900">{arrendador.mail || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{arrendador.telefono || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{arrendador.localidad?.nombre_localidad}, {arrendador.localidad.provincia.nombre_provincia}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link href={`/arrendadores/${arrendador.id}`}><button className="btn-icon-blue"><Eye size={16}/></button></Link>
                            <Link href={`/arrendadores/${arrendador.id}/edit`}><button className={`btn-icon-yellow ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}><Edit size={16}/></button></Link>
                            <button onClick={() => handleDelete(arrendador.id)} className={`btn-icon-red ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}><Trash2 size={16}/></button>
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
