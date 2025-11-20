'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { UsuarioDtoOut } from '@/lib/type';
import { toast } from 'sonner';
import { deleteUsuario, fetchUsuarios } from '@/lib/usuarios/auth';
import { useAuth } from '@/components/context/AuthContext';
import { formatCuit, formatCuitDisplay, getRolBadgeColor } from '@/lib/helpers';

const ITEMS_PER_PAGE = 8;

/**
 * @page UsuariosPage
 * @description Página para la gestión de usuarios del sistema. Permite a los administradores
 *              ver, buscar, crear y eliminar usuarios.
 * @returns {JSX.Element} La página de gestión de usuarios.
 */
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDtoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth()
  const [searchTermNombre, setSearchTermNombre] = useState('');
  const [searchTermCuit, setSearchTermCuit] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * @effect
   * @description Carga la lista de usuarios al montar el componente.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchUsuarios();
        setUsuarios(data);
      } catch (err) {
        setError("No se pudieron cargar los usuarios");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /**
   * @memo filteredData
   * @description Memoriza la lista de usuarios filtrada por nombre y CUIL.
   */
  const filteredData = useMemo(() => {
    return usuarios.filter(item => {
      const matchesNombre = item.nombre
        .toLowerCase()
        .includes(searchTermNombre.toLowerCase());
      const matchesCuit = item.cuil
        .toLowerCase()
        .includes(searchTermCuit.toLowerCase().replace(/-/g,""));

      return matchesNombre && matchesCuit;
    });
  }, [usuarios, searchTermNombre, searchTermCuit]);
  
  /**
   * @memo paginatedData
   * @description Memoriza la porción de datos para la página actual.
   */
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermNombre, searchTermCuit]);

  /**
   * @function handleDelete
   * @description Muestra una confirmación y elimina un usuario.
   * @param {number} id - El ID del usuario a eliminar.
   */
  const handleDelete = (id: number) => {
    if (id === user?.id) {
      toast.error("No puede eliminarse a sí mismo.");
      return;
    }
    // Confirmación
    const confirmToastId = toast.info(
      "¿Está seguro que desea eliminar este usuario?",
      {
        action: {
          label: "Confirmar",
          onClick: () => {
            toast.dismiss(confirmToastId);
            //Delete
            toast.promise(
              deleteUsuario(id).then(() => {
                setUsuarios(prev =>
                  prev.filter((item) => item.id !== id)
                );
              }),
              {
                loading: "Eliminando usuario...",
                success: "Usuario eliminado con éxito",
                error: (err) => err.message || "Error al eliminar el usuario",
              }
            );
          },
        },
        duration: 5000, // 5 segundos
      }
    );
  };
  return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <Link href="/usuarios/post" passHref>
              <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Nuevo Usuario</span>
              </button>
            </Link>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput
                placeholder="Buscar..."
                value={searchTermNombre}
                onChange={setSearchTermNombre}
                label="Nombre"
              />
              <SearchInput
                placeholder="ej: 99-999999-9"
                value={formatCuitDisplay(searchTermCuit)}
                onChange={setSearchTermCuit}
                label="CUIT-CUIL"
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
                No se encontraron usuarios que coincidan con los filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Apellido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        CUIT-CUIL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Mail
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                          <div className="truncate">{usuario.nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usuario.apellido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                            {formatCuit(usuario.cuil)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          {usuario.mail || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolBadgeColor(usuario.rol)}`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href = {`/usuarios/${usuario.id}/edit`} passHref>
                              <button className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded transition-colors" title="Editar">
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                            <button onClick={() => handleDelete(usuario.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors" title="Eliminar">
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

          {/* Paginación */}
            <div className="mt-6 flex justify-between">
                <Link href="/dashboard" passHref> 
                  <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                    Volver
                  </button>
                </Link>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
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
