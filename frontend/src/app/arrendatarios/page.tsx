'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ArrendatarioDtoOut } from '@/lib/type';
import { toast } from 'sonner';
import { deleteArrendatario, fetchArrendatarios } from '@/lib/arrendatarios/auth';
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
 * @page ArrendatariosPage
 * @description Página principal para la gestión de arrendatarios. Muestra una lista paginada
 *              y filtrable, permitiendo crear, ver, editar y eliminar registros.
 * @returns {JSX.Element} La página de gestión de arrendatarios.
 */
export default function ArrendatariosPage() {
  const [arrendatarios, setArrendatarios] = useState<ArrendatarioDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);
  const [searchTermNombre, setSearchTermNombre] = useState('');
  const [searchTermCuit, setSearchTermCuit] = useState('');
  const [condicionFilter, setCondicionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * @effect
   * @description Carga la lista inicial de arrendatarios desde la API.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchArrendatarios();
        setArrendatarios(data);
      } catch (err) {
        setError("No se pudieron cargar los arrendatarios");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /**
   * @memo filteredData
   * @description Memoriza la lista de arrendatarios filtrada por los criterios de búsqueda.
   */
  const filteredData = useMemo(() => {
    return arrendatarios.filter(item =>
        item.razon_social.toLowerCase().includes(searchTermNombre.toLowerCase()) &&
        item.cuit.toLowerCase().includes(searchTermCuit.toLowerCase().replace(/-/g,"")) &&
        (!condicionFilter || item.condicion_fiscal === condicionFilter)
    );
  }, [arrendatarios, searchTermNombre, searchTermCuit, condicionFilter]);

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
   * @description Resetea la paginación cuando cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermNombre, searchTermCuit, condicionFilter]);

  /**
   * @function handleDelete
   * @description Muestra una confirmación y elimina un arrendatario.
   * @param {number} id - El ID del arrendatario a eliminar.
   */
  const handleDelete = (id: number) => {
    toast.info("¿Está seguro que desea eliminar este arrendatario?", {
      action: {
        label: "Confirmar",
        onClick: () => {
          toast.promise(
            deleteArrendatario(id).then(() => {
              setArrendatarios(prev => prev.filter(item => item.id !== id));
            }),
            {
              loading: "Eliminando...",
              success: "Arrendatario eliminado con éxito",
              error: (err) => err.message || "Error al eliminar",
            }
          );
        },
      },
      duration: 5000,
    });
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Arrendatarios</h1>
            <Link href="/arrendatarios/post">
              <button className={`btn-primary ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}>
                <Plus size={16} /><span>Nuevo Arrendatario</span>
              </button>
            </Link>
          </div>

          <div className="bg-slate-100 rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-sm font-medium mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput label="Razón Social" value={searchTermNombre} onChange={setSearchTermNombre} />
              <SearchInput label="CUIT-CUIL" value={formatCuitDisplay(searchTermCuit)} onChange={setSearchTermCuit} />
              <SelectFilter label="Condición Fiscal" options={condicionFiscalOptions} value={condicionFilter} onChange={setCondicionFilter} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading && <div className="text-center py-12">Cargando...</div>}
            {error && <div className="text-center py-12 text-red-500 font-semibold">{error}</div>}
            {!loading && !error && filteredData.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron arrendatarios.</div>}
            {!loading && !error && filteredData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="th-class">Razón Social</th>
                      <th className="th-class">CUIT-CUIL</th>
                      <th className="th-class">Condición Fiscal</th>
                      <th className="th-class">Mail</th>
                      <th className="th-class">Localidad</th>
                      <th className="th-class">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {paginatedData.map((arrendatario) => (
                      <tr key={arrendatario.id} className="hover:bg-gray-50">
                        <td className="td-class max-w-xs truncate">{arrendatario.razon_social}</td>
                        <td className="td-class">{formatCuit(arrendatario.cuit)}</td>
                        <td className="td-class"><span className={`badge ${getCondicionBadgeColor(arrendatario.condicion_fiscal)}`}>{arrendatario.condicion_fiscal.replace(/_/g, ' ')}</span></td>
                        <td className="td-class">{arrendatario.mail || "-"}</td>
                        <td className="td-class">{arrendatario.localidad?.nombre_localidad}, {arrendatario.localidad.provincia.nombre_provincia}</td>
                        <td className="td-class">
                          <div className="flex space-x-2">
                            <Link href={`/arrendatarios/${arrendatario.id}`}><button className="btn-icon-blue"><Eye size={16}/></button></Link>
                            <Link href={`/arrendatarios/${arrendatario.id}/edit`}><button className={`btn-icon-yellow ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}><Edit size={16}/></button></Link>
                            <button onClick={() => handleDelete(arrendatario.id)} className={`btn-icon-red ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}><Trash2 size={16}/></button>
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
