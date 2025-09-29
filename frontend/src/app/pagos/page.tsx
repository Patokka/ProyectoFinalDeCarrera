'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, FileText } from 'lucide-react';
import SelectFilter from '@/components/ui/SelectFilter';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { facturarPagos, fetchPagos } from '@/lib/pagos/auth';
import { PagoDtoOut } from '@/lib/type';
import { formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, getPagoBadgeColor } from '@/lib/helpers';

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
    const allCurrentPageIds = paginatedData.filter(pago => (pago.estado === "PENDIENTE" && pago.precio_promedio) || pago.estado === "VENCIDO").map(pago => pago.id);
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
                
                //Facturar
                toast.promise(facturarPagos(selectedPagos).then(async () => {
                
                //Refrescar los pagos
                const nuevosPagos = await fetchPagos();
                setPagos(nuevosPagos);

                //Deseleccionar los pagos facturados
                setSelectedPagos([]);

                return nuevosPagos; // para que toast.promise sepa que terminó bien
              }),
              {
                loading: "Facturando pagos...",
                success: "Facturaciones realizadas con éxito",
                error: (err) => err.message || "Error al eliminar el arrendador",
              });
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
              <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Nuevo Pago Particular</span>
              </button>
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
                        Precio Promedio Quintal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Quintales
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <input
                              type="checkbox"
                              checked={selectedPagos.includes(pago.id)}
                              onChange={() => handleSelectPago(pago.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled= {pago.estado === "CANCELADO" || pago.estado === "REALIZADO" || (pago.estado === "PENDIENTE" && !pago.precio_promedio)}
                            />
                          </div>
                        </td>
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
                          {pago.precio_promedio? formatCurrency(pago.precio_promedio) : "-" }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.quintales || pago.participacion_arrendador.porcentaje + "%"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pago.fuente_precio || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {pago.monto_a_pagar? formatCurrency(pago.monto_a_pagar) : "-" }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-gray-50 rounded transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Fila de totales */}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={5} className="px-6 py-3 text-sm text-gray-900">
                        Totales pagos Pendientes / Vencidos:
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {paginatedData.reduce(
                          (acc, p) =>
                            (p.estado === "PENDIENTE" || p.estado === "VENCIDO")
                              ? acc + (p.quintales ?? 0)
                              : acc,
                          0
                        )}
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
          {selectedPagos.length > 0 && (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 pb-0 pt-0 h- w-fit">
              <h6 className="text-sm font-medium text-blue-900 ">Nota:</h6>
              <p className="text-sm text-blue-800 leading-relaxed">
                Los pagos pueden estar sujetos a retenciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
