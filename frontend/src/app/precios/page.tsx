'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { toast } from 'sonner';
import { PrecioDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { deletePrecio, fetchPreciosAGD, fetchPreciosBCR } from '@/lib/precios/auth';
import PrecioModal from '@/components/ui/PriceModal';
import EditPrecioModal from '@/components/ui/EditPrecioModal';
import { useAuth } from '@/components/context/AuthContext';

const ITEMS_PER_PAGE = 6;

export default function PreciosPage() {
  const [preciosBCR, setPreciosBCR] = useState<PrecioDtoOut[]>([]);
  const [preciosAGD, setPreciosAGD] = useState<PrecioDtoOut[]>([]);
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPageBCR, setCurrentPageBCR] = useState(1);
  const [currentPageAGD, setCurrentPageAGD] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [precioSeleccionado, setPrecioSeleccionado] = useState<PrecioDtoOut | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);

  // Filtrado de datos BCR
  const filteredBCRData = useMemo(() => {
    return preciosBCR.filter(item => {
      const fecha = new Date(item.fecha_precio);
      return (!fechaDesde || fecha >= new Date(fechaDesde)) && (!fechaHasta || fecha <= new Date(fechaHasta));
    });
  }, [preciosBCR, fechaDesde, fechaHasta]);

  // Filtrado de datos AGD
  const filteredAGDData = useMemo(() => {
    return preciosAGD.filter(item => {
      const fecha = new Date(item.fecha_precio);
      return (!fechaDesde || fecha >= new Date(fechaDesde)) && (!fechaHasta || fecha <= new Date(fechaHasta));
    });
  }, [preciosAGD, fechaDesde, fechaHasta]);

  // Paginación BCR
  const totalPagesBCR = Math.ceil(filteredBCRData.length / ITEMS_PER_PAGE);
  const paginatedBCRData = useMemo(() => {
    const startIndex = (currentPageBCR - 1) * ITEMS_PER_PAGE;
    return filteredBCRData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBCRData, currentPageBCR]);

  // Paginación AGD
  const totalPagesAGD = Math.ceil(filteredAGDData.length / ITEMS_PER_PAGE);
  const paginatedAGDData = useMemo(() => {
    const startIndex = (currentPageAGD - 1) * ITEMS_PER_PAGE;
    return filteredAGDData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAGDData, currentPageAGD]);

  // Reset páginas cuando cambian los filtros
  useEffect(() => {
    setCurrentPageBCR(1);
    setCurrentPageAGD(1);
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    const loadPrecios = async () => {
      try{
        setLoading(true)
        const dataBCR = await fetchPreciosBCR();
        const dataAGD = await fetchPreciosAGD();
        setPreciosAGD(dataAGD);
        setPreciosBCR(dataBCR);
      }catch(e){
        toast.error("Error al cargar los precios")
        setError("Error al cargar los precios")
      }finally{
        setLoading(false)
      }
    }
    loadPrecios();
  },[]);

  const handleCargarPrecio = () => {
    setIsModalOpen(true);
  };

  const handleEditPrecio = (precio: PrecioDtoOut) => {
      setPrecioSeleccionado(precio);
      setIsEditModalOpen(true);
    };

  const handleDelete = (precio: PrecioDtoOut) => {
    // Confirmación
    const confirmToastId = toast.info(
      "¿Está seguro que desea eliminar este precio?",
      {
        action: {
          label: "Confirmar",
          onClick: () => {
            toast.dismiss(confirmToastId);
            
            //Delete
            toast.promise(
              deletePrecio(precio.id).then(() => {
                if(precio.origen == 'AGD'){
                  setPreciosAGD(prev =>
                    prev.filter((item) => item.id !== precio.id)
                  );
                }else{
                  setPreciosBCR(prev =>
                    prev.filter((item) => item.id !== precio.id)
                  );
                }
              }),
              {
                loading: "Eliminando precio...",
                success: "Precio eliminado con éxito",
                error: (err) => err.message || "Error al eliminar el precio",
              }
            );
          },
        },
        duration: 5000, // 5 segundos
      }
    );
  };

  // Tabla de precios reutilizable
  const PreciosTable = ({data, title, currentPage, totalPages, onPageChange}: { data: PrecioDtoOut[]; title: string; currentPage: number; totalPages: number; onPageChange: (page: number) => void; }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}:</h3>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando pagos...</p>
          </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron pagos que coincidan con los filtros.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Precio Tonelada Soja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((precio) => (
                  <tr key={precio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(precio.fecha_precio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(precio.precio_obtenido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditPrecio(precio)}
                        className={`p-1 rounded transition-colors ${canEditEliminate ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 cursor-pointer": "text-gray-400  cursor-not-allowed"}`} title="Editar"
                        disabled={!canEditEliminate}>
                          <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(precio)} 
                              className={`p-1 rounded transition-colors ${canEditEliminate ? "text-red-600 hover:text-red-900 hover:bg-red-50 cursor-pointer": "text-gray-400 cursor-not-allowed"}`} title="Eliminar"
                              disabled={!canEditEliminate}>
                          <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Precios</h1>
            <button 
              onClick={handleCargarPrecio}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
              disabled={!canEditEliminate || loading}>
                <Plus className="h-4 w-4" />
                <span>Nuevo Precio</span>
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput value={fechaDesde} onChange={setFechaDesde} label="Desde" placeholder="Seleccionar fecha" />
              <DateInput value={fechaHasta} onChange={setFechaHasta} label="Hasta" placeholder="Seleccionar fecha" />
            </div>
          </div>
          {/* Layout principal con tablas y nota */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Tabla BCR */}
            <PreciosTable
              data={paginatedBCRData}
              title="Bolsa de Comercio de Rosario (BCR)"
              currentPage={currentPageBCR}
              totalPages={totalPagesBCR}
              onPageChange={setCurrentPageBCR}
            />

            {/* Nota en el medio */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-fit self-start">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Nota:</h4>
              <p className="text-sm text-blue-800 leading-snug">
                El precio diario de la Bolsa de Comercio de Rosario es actualizado de 
                forma automática todos los días a las 11 a.m.
              </p>
            </div>

            {/* Tabla AGD */}
            <PreciosTable
              data={paginatedAGDData}
              title="Aceitera General Deheza (AGD)"
              currentPage={currentPageAGD}
              totalPages={totalPagesAGD}
              onPageChange={setCurrentPageAGD}
            />
          </div>


          {/* Botón Volver */}
          <div className="mt-6">
            <Link href="/dashboard" passHref>
              <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                Volver
              </button>
            </Link>
          </div>
        </div>
      </div>
      <PrecioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          try {
            const dataBCR = await fetchPreciosBCR();
            const dataAGD = await fetchPreciosAGD();
            setPreciosAGD(dataAGD);
            setPreciosBCR(dataBCR);
            setIsModalOpen(false);
          } catch (e) {
            toast.error("Error al actualizar la lista de precios");
          }
        }}
      />
      <EditPrecioModal
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setPrecioSeleccionado(null);
        }}
        onSuccess={async () => {
            try {
                const dataBCR = await fetchPreciosBCR();
                const dataAGD = await fetchPreciosAGD();
                setPreciosAGD(dataAGD);
                setPreciosBCR(dataBCR);
                setIsEditModalOpen(false);
                setPrecioSeleccionado(null);
            } catch (e) {
                toast.error("Error al actualizar la lista de precios");
            }
        }}
      precioActual={precioSeleccionado!}
      />
    </ProtectedRoute>
  );
}
