'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, FileText } from 'lucide-react';
import SelectFilter from '@/components/ui/SelectFilter';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { format, parseISO, endOfMonth } from 'date-fns';

// Datos de ejemplo basados en tu mockup
const pagosData = [
  {
    id: 1,
    estado: 'REALIZADO',
    quintales: 130,
    precio_promedio: 39400,
    vencimiento: '2025-09-02',
    fuente_precio: 'BCR',
    monto_a_pagar: 5122000,
    arrendamiento: {
      id: 1,
      estado: 'ACTIVO',
      tipo: 'FIJO',
      arrendatario: { razon_social: 'NORDESAN' },
    },
    participacion_arrendador: {
      arrendador: { nombre_o_razon_social: 'ANDREA BUSSI' }
    }
  },
  {
    id: 2,
    estado: 'PENDIENTE',
    quintales: 190,
    precio_promedio: 99999,
    vencimiento: '2025-09-04',
    fuente_precio: 'AGD',
    monto_a_pagar: 9999999,
    arrendamiento: {
      id: 2,
      estado: 'ACTIVO',
      tipo: 'FIJO',
      arrendatario: { razon_social: 'NORDESAN' },
    },
    participacion_arrendador: {
      arrendador: { nombre_o_razon_social: 'IVAN GAGGIOTTI' }
    }
  },
  {
    id: 3,
    estado: 'PENDIENTE',
    quintales: 999,
    precio_promedio: 99999,
    vencimiento: '2025-09-05',
    fuente_precio: 'BCR',
    monto_a_pagar: 9999999,
    arrendamiento: {
      id: 3,
      estado: 'ACTIVO',
      tipo: 'APARCERIA',
      arrendatario: { razon_social: 'FIRST COUSIN' },
    },
    participacion_arrendador: {
      arrendador: { nombre_o_razon_social: 'SILVINA GAGGIOTTI' }
    }
  },
  {
    id: 4,
    estado: 'PENDIENTE',
    quintales: 999,
    precio_promedio: 99999,
    vencimiento: '2025-09-06',
    fuente_precio: 'AGD',
    monto_a_pagar: 9999999,
    arrendamiento: {
      id: 4,
      estado: 'ACTIVO',
      tipo: 'FIJO',
      arrendatario: { razon_social: 'NORDESAN' },
    },
    participacion_arrendador: {
      arrendador: { nombre_o_razon_social: 'ANDREA BUSSI' }
    }
  },
  {
    id: 5,
    estado: 'PENDIENTE',
    quintales: 999,
    precio_promedio: 99999,
    vencimiento: '2025-09-07',
    fuente_precio: 'BCR',
    monto_a_pagar: 9999999,
    arrendamiento: {
      id: 5,
      estado: 'ACTIVO',
      tipo: 'FIJO',
      arrendatario: { razon_social: 'NORDESAN' },
    },
    participacion_arrendador: {
      arrendador: { nombre_o_razon_social: 'PATRICIO GAGGIOTTI' }
    }
  }
];

// Opciones para los filtros
const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'REALIZADO', label: 'REALIZADO' },
  { value: 'VENCIDO', label: 'VENCIDO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

const ITEMS_PER_PAGE = 10;

// Helpers
const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
const getLastDayOfCurrentMonth = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');

export default function PagosPage() {
  const [pagos, setPagos] = useState(pagosData);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaMaxima, setFechaMaxima] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPagos, setSelectedPagos] = useState<number[]>([]);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return pagos.filter(item => {

      const matchesEstado = !estadoFilter || item.estado === estadoFilter;

      const matchesFecha = !fechaMaxima || new Date(item.vencimiento) <= new Date(fechaMaxima);

      return matchesEstado && matchesFecha;
    });
  }, [pagos, estadoFilter, fechaMaxima]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFilter, fechaMaxima]);

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'REALIZADO':
        return 'bg-green-100 text-green-800';
      case 'VENCIDO':
        return 'bg-red-100 text-red-800';
      case 'CANCELADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectPago = (pagoId: number) => {
    setSelectedPagos(prev => 
      prev.includes(pagoId) 
        ? prev.filter(id => id !== pagoId)
        : [...prev, pagoId]
    );
  };

  const handleSelectAll = () => {
    const allCurrentPageIds = paginatedData.map(pago => pago.id);
    const allSelected = allCurrentPageIds.every(id => selectedPagos.includes(id));
    
    if (allSelected) {
      setSelectedPagos(prev => prev.filter(id => !allCurrentPageIds.includes(id)));
    } else {
      setSelectedPagos(prev => Array.from(new Set([...prev, ...allCurrentPageIds])));    }
  };

  const handleFacturarSeleccionados = () => {
    if (selectedPagos.length === 0) return;
    
    console.log('Facturando pagos:', selectedPagos);
    alert(`Facturando ${selectedPagos.length} pago(s) seleccionado(s)`);
  };

  const allCurrentPageSelected = paginatedData.length > 0 && 
    paginatedData.every(pago => selectedPagos.includes(pago.id));

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
                value={fechaMaxima}
                onChange={setFechaMaxima}
                label="Fecha máxima"
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>
          {/* Tabla */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pago.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(pago.estado)}`}>
                          {pago.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pago.vencimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(pago.precio_promedio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pago.quintales || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pago.fuente_precio || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(pago.monto_a_pagar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors" >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-gray-50 rounded transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron pagos que coincidan con los filtros.</p>
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
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors">
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
