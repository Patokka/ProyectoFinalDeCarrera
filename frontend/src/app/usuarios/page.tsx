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
    return usuarios.filter(item =>
        item.nombre.toLowerCase().includes(searchTermNombre.toLowerCase()) &&
        item.cuil.toLowerCase().includes(searchTermCuit.toLowerCase().replace(/-/g,""))
    );
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

  /**
   * @effect
   * @description Resetea la paginación cuando cambian los filtros.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermNombre, searchTermCuit]);

  /**
   * @function handleDelete
   * @description Muestra una confirmación y elimina un usuario.
   * @param {number} id - El ID del usuario a eliminar.
   */
  const handleDelete = (id: number) => {
    if (id === user?.id) return toast.error("No puede eliminarse a sí mismo.");

    toast.info("¿Está seguro que desea eliminar este usuario?", {
      action: {
        label: "Confirmar",
        onClick: () => {
          toast.promise(
            deleteUsuario(id).then(() => {
              setUsuarios(prev => prev.filter(item => item.id !== id));
            }),
            {
              loading: "Eliminando...",
              success: "Usuario eliminado con éxito",
              error: (err) => err.message || "Error al eliminar",
            }
          );
        },
      },
      duration: 5000,
    });
  };

  return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <Link href="/usuarios/post">
              <button className="btn-primary">
                <Plus size={16} /><span>Nuevo Usuario</span>
              </button>
            </Link>
          </div>

          <div className="bg-slate-100 rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-sm font-medium mb-3 underline">Filtrar:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput label="Nombre" value={searchTermNombre} onChange={setSearchTermNombre} />
              <SearchInput label="CUIT-CUIL" value={formatCuitDisplay(searchTermCuit)} onChange={setSearchTermCuit} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* ... Renderizado condicional de tabla, loading, error ... */}
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
