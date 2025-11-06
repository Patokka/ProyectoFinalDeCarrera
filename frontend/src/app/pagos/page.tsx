'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Plus, FileText, Calculator, Edit } from 'lucide-react';
import SelectFilter from '@/components/ui/SelectFilter';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { facturarPagos, fetchPagos } from '@/lib/pagos/auth';
import { PagoDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, getPagoBadgeColor } from '@/lib/helpers';
import PagoParticularModal from '@/components/ui/PagoParticularModal';
import AsignarPrecioModal from '@/components/ui/AsignarPrecioPagoModal';
import { useAuth } from '@/components/context/AuthContext';
import EditPagoModal from '@/components/ui/EditPagoModal';

// Opciones para los filtros
const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'REALIZADO', label: 'REALIZADO' },
  { value: 'VENCIDO', label: 'VENCIDO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

const ITEMS_PER_PAGE = 7;


export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoDtoOut[]>([]);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
  const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPagos, setSelectedPagos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isAsignarPrecioPagoModalOpen, setIsAsignarPrecioPagoModalOpen] = useState(false);
  const { user } = useAuth();
  const canEditEliminate = canEditOrDelete(user?.rol);
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoDtoOut | null>(null);
  
  const loadPagos = async () => {
    try {
      setLoading(true);
      const data = await fetchPagos();
      setPagos(data);
    } catch (e) {
      toast.error("Error al cargar los pagos");
      setError("Error al cargar los pagos")
    } finally {
        setLoading(false);
      }
    };

    // Filtrar datos
  const filteredData = useMemo(() => {
    return pagos.filter(item => {
      const matchesEstado =
        !estadoFilter || item.estado === estadoFilter;
      const fecha = new Date(item.vencimiento);
      const matchesFechaDesde =
        !fechaDesde || fecha >= new Date(fechaDesde);
      const matchesFechaHasta =
        !fechaHasta || fecha <= new Date(fechaHasta);
      return matchesEstado && matchesFechaDesde && matchesFechaHasta;
    });
  }, [pagos, estadoFilter, fechaDesde, fechaHasta]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    loadPagos();
  }, []);

  const handleSelectPago = (pagoId: number) => {
    setSelectedPagos(prev =>
      prev.includes(pagoId)
        ? prev.filter(id => id !== pagoId)
        : [...prev, pagoId]
    );
  };

  const handleSelectAll = () => {
    const allCurrentPageIds = paginatedData.filter(pago => (pago.estado === "PENDIENTE" && pago.precio_promedio && !!pago.quintales) || pago.estado === "VENCIDO").map(pago => pago.id);
    const allSelected = allCurrentPageIds.every(id => selectedPagos.includes(id));

    if (allSelected) {
      setSelectedPagos(prev => prev.filter(id => !allCurrentPageIds.includes(id)));
    } else {
      setSelectedPagos(prev => Array.from(new Set([...prev, ...allCurrentPageIds])));
    }
  };

  const handleFacturarSeleccionados = () => {
    const confirmToastId = toast.info(
      `¿Está seguro que desea facturar ${selectedPagos.length} pago(s)?`,
      {
        action: {
          label: "Confirmar",
          onClick: () => {
            toast.dismiss(confirmToastId);

            // Facturar
            toast.promise(
              facturarPagos(selectedPagos).then(() => {
                // Recargar la página al finalizar con éxito para actualizar sidebar
                setTimeout(() => {window.location.href = "/pagos";}, 1500);
              }),
              {
                loading: "Facturando pagos...",
                success: "Facturaciones realizadas con éxito",
                error: (err) => err.message || "Error al facturar los pagos",
              }
            );
          },
        },
        duration: 5000, // 5 segundos
      }
    );
  };

  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.filter(pago => (pago.estado === "PENDIENTE" && pago.precio_promedio) || pago.estado === "VENCIDO").every(pago => selectedPagos.includes(pago.id));

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 p-6">
        <div className="">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
              <div className='flex justify-around gap-3'>
                <button onClick={() => setIsAsignarPrecioPagoModalOpen(true)} className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
                        disabled={!canEditEliminate}>
                  <Calculator className="h-4 w-4" />
                  <span>Calcular Precio de Pago</span>
                </button>
                <button onClick={() => setIsPagoModalOpen(true)} className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
                        disabled={!canEditEliminate}>
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Pago Particular</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectFilter
                options={estadoOptions}
                value={estadoFilter}
                onChange={setEstadoFilter}
                placeholder="ej: PENDIENTE"
                label="Estado"
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
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando pagos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron pagos que coincidan con los filtros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {canEditEliminate &&  
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={allCurrentPageSelected}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Facturar</span>
                          </div>
                        </th>
                      }
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Vencimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Precio Promedio Quintal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Quintales - Porcentaje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Origen Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((pago) => (
                      <tr key={pago.id} className="hover:bg-gray-50">
                        {canEditEliminate &&
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center items-center">
                              <input
                                type="checkbox"
                                checked={selectedPagos.includes(pago.id)}
                                onChange={() => handleSelectPago(pago.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled= {pago.estado === "CANCELADO" || pago.estado === "REALIZADO" || (pago.estado === "PENDIENTE" && !pago.precio_promedio && !!pago.quintales)}
                              />
                            </div>
                          </td>
                        }
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pago.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPagoBadgeColor(pago.estado)}`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(pago.vencimiento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.participacion_arrendador.arrendador?.nombre_o_razon_social || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.precio_promedio? formatCurrency(pago.precio_promedio) : "-" }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.quintales? pago.quintales.toFixed(2) + ' qq' : pago.porcentaje + "%"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.fuente_precio || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {pago.monto_a_pagar? formatCurrency(pago.monto_a_pagar) : "-" }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href = {`pagos/${pago.id}`}>
                              <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedPago(pago);
                                setIsEditPagoModalOpen(true);}}
                              className={`p-1 rounded transition-colors ${canEditEliminate && (pago.estado === 'PENDIENTE' || pago.estado === 'VENCIDO') ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 cursor-pointer": "text-gray-400  cursor-not-allowed"}`} title="Editar"
                              disabled={pago.estado === 'REALIZADO' || pago.estado === 'CANCELADO' || !canEditEliminate}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Fila de totales */}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={6} className="px-6 py-3 text-sm text-gray-900">
                        Totales pagos Pendientes / Vencidos:
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {paginatedData.reduce(
                          (acc, p) =>
                            (p.estado === "PENDIENTE" || p.estado === "VENCIDO")
                              ? acc + (p.quintales ?? 0)
                              : acc,
                          0
                        ).toFixed(2) + ' qq'}
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(
                          paginatedData.reduce(
                            (acc, p) =>
                              (p.estado === "PENDIENTE" || p.estado === "VENCIDO")
                                ? acc + (p.monto_a_pagar ?? 0)
                                : acc,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botón Facturar Seleccionados */}
          {canEditEliminate && selectedPagos.length > 0 && (
            <div className="mb-4 py-3">
              <button
                onClick={handleFacturarSeleccionados}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Facturar seleccionado/s ({selectedPagos.length})</span>
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 pb-0 pt-0 px-3 w-fit">
              <h6 className="text-sm font-medium text-blue-900 ">Nota:</h6>
              <p className="text-sm text-blue-800 leading-relaxed">
                Los pagos pueden estar sujetos a retenciones.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PagoParticularModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        onSuccess={() => {
          setIsPagoModalOpen(false);
          loadPagos(); 
          window.location.reload();
        }}
      />
      <AsignarPrecioModal
        isOpen={isAsignarPrecioPagoModalOpen}
        onClose={() => setIsAsignarPrecioPagoModalOpen(false)}
        onSuccess={() => {
          setIsAsignarPrecioPagoModalOpen(false);
          loadPagos(); 
          window.location.reload();
        }}
      />
      <EditPagoModal
        isOpen={isEditPagoModalOpen}
        onClose={() => setIsEditPagoModalOpen(false)}
        onSuccess={() => {
          setIsEditPagoModalOpen(false);
          setTimeout(() => {window.location.reload();}, 1000);
        }}
        pago={selectedPago}
      />
    </ProtectedRoute>
  );
}
