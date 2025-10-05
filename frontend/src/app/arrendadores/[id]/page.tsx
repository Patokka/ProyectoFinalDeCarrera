'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, FileText, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { ArrendadorDtoOut, PagoDtoOut } from '@/lib/type';
import { formatCuit, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import { facturarPagos, fetchPagosByArrendador } from '@/lib/pagos/auth';
import Text from '@/components/ui/Text'
import Link from 'next/link';
import { deleteArrendador, fetchArrendadorById } from '@/lib/arrendadores/auth';

const ITEMS_PER_PAGE = 5;

export default function ArrendadorDetailPage() {
const params = useParams();
const idArrendador = params?.id;
const [arrendador, setArrendador] = useState<ArrendadorDtoOut>();
const [pagos, setPagos] = useState<PagoDtoOut[]>([]);
const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth());
const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth());
const [currentPage, setCurrentPage] = useState(1);
const [selectedPagos, setSelectedPagos] = useState<number[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const router = useRouter();

// Cargar arrendador + pagos
useEffect(() => {
    const load = async () => {
    if (!idArrendador) {
        setError('Id de arrendador inválido');
        setLoading(false);
        return;
    }
    try {
        setLoading(true);
        const arr = await fetchArrendadorById(Number(idArrendador));
        const pagosArr = await fetchPagosByArrendador(Number(idArrendador));
        setArrendador(arr);
        setPagos(pagosArr);
    } catch (e: any) {
        toast.error('Error al cargar los datos del arrendador');
        setError('Error al cargar datos');
    } finally {
        setLoading(false);
    }
    };
    load();
}, [idArrendador]);

// Filtrado de pagos
const filteredPagos = useMemo(() => {
    return pagos.filter(pago => {
        const venc = new Date(pago.vencimiento);
        const desdeOk = !fechaDesde || venc >= new Date(fechaDesde);
        const hastaOk = !fechaHasta || venc <= new Date(fechaHasta);
        return desdeOk && hastaOk;
    });
}, [pagos, fechaDesde, fechaHasta]);

  // Paginación
const totalPages = Math.ceil(filteredPagos.length / ITEMS_PER_PAGE);
const paginatedPagos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPagos.slice(start, start + ITEMS_PER_PAGE);
}, [filteredPagos, currentPage]);

  // Reset página al cambiar filtros
useEffect(() => {
    setCurrentPage(1);
}, [fechaDesde, fechaHasta]);

const handleSelectPago = (id: number) => {
    setSelectedPagos(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
};

const handleSelectAll = () => {
    const validIds = paginatedPagos
        .filter(p => (p.estado === 'PENDIENTE' && p.precio_promedio != null) || p.estado === 'VENCIDO')
        .map(p => p.id);
    const allSelected = validIds.every(i => selectedPagos.includes(i));
    if (allSelected) {
        setSelectedPagos(prev => prev.filter(i => !validIds.includes(i)));
    } else {
        setSelectedPagos(prev => Array.from(new Set([...prev, ...validIds])));
    }
};

const handleFacturarSeleccionados = () => {
    if (selectedPagos.length === 0) return;
    const toastId = toast.info(`¿Está seguro que desea facturar ${selectedPagos.length} pago(s)?`, {
    action: {
        label: 'Confirmar',
        onClick: async () => {
        toast.dismiss(toastId);
        try {
            await facturarPagos(selectedPagos);
            // recargar pagos
            if (idArrendador) {
                const nuevos = await fetchPagosByArrendador(Number(idArrendador));
                setPagos(nuevos);
            }
            setSelectedPagos([]);
            toast.success('Facturaciones realizadas con éxito');
        } catch (e: any) {
            toast.error('Error al facturar pagos');
        }
        }
    },
    duration: 5000
    });
};

const allOnPageSelected = paginatedPagos.length > 0 && paginatedPagos
    .filter(p => (p.estado === 'PENDIENTE' && p.precio_promedio != null) || p.estado === 'VENCIDO')
    .every(p => selectedPagos.includes(p.id));

  // Renderizado estados de UI
if (loading) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del arrendador...</p>
            </div>
        </ProtectedRoute>
    );
}
if (error) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
            <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
            </div>
        </ProtectedRoute>
    );
}
if (!arrendador) {
    return (
        <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="text-center py-12 font-semibold text-gray-700">
                No se encontró el arrendador
            </div>
        </div>
        </ProtectedRoute>
    );
}

function handleDeleteArrendador(){
    const toastId = toast.info(`¿Está seguro que desea eliminar el arrendador?`, {
    action: {
        label: 'Confirmar',
        onClick: async () => {
        toast.dismiss(toastId);
        try {
            await deleteArrendador(Number(idArrendador));
            toast.success('Arrendador eliminado con éxito, volviendo a la página de arrendadores...');
            setTimeout(() => router.push('/arrendadores'), 1000);
        } catch (e: any) {
            toast.error(e.message);
        }
        }
    },
    duration: 5000
    });
}

return (
    <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Detalle de Arrendador</h1>
                </div>
                <Link href = {`/arrendador/${arrendador.id}/edit`} passHref> 
                    <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                        <Edit className="h-4 w-4" />
                        <span>Editar Arrendador</span>
                    </button>
                </Link>
            </div>

            {/* Información del arrendador */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Text label="Nombre o Razón Social:"
                        value={arrendador.nombre_o_razon_social}
                        readOnly={true}
                        disabled={false}
                    />
                    <Text label="CUIL-CUIT:"
                        value={formatCuit(arrendador.cuil)}
                        readOnly={true}
                        disabled={false}
                    /> 
                    <Text label="Condición Fiscal:"
                        value={arrendador.condicion_fiscal.replace('_', ' ')}
                        readOnly={true}
                        disabled={false}
                    /> 
                    <Text label="Teléfono:"
                        value={arrendador.telefono? arrendador.telefono : ' - '}
                        disabled={false}
                        readOnly={true}
                    />
                    <Text label="Localidad:"
                        value={`${arrendador.localidad.nombre_localidad}, ${arrendador.localidad.provincia.nombre_provincia}`}
                        readOnly={true}
                        disabled={false}
                    />
                    <Text label="Mail:"
                        value={arrendador.mail ?? ' - '}
                        readOnly={true}
                        disabled={false}
                    />
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                        <textarea
                        value={arrendador.descripcion ?? ' - '}
                        readOnly
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    </div>
                </div>
            </div>

            {/* Sección de pagos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Pagos Pendientes:</h2>
                </div>
                {/* Filtros */}
                <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
                    <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-700 underline">Filtrar:</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Tabla de pagos */}
            <div className="overflow-x-auto">
                {paginatedPagos.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No se encontraron pagos que coincidan con los filtros o no se tienen pagos pendientes.</p>
                    </div>
                ) : (
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={allOnPageSelected}
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
                                    Vencimiento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Arrendamiento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Quintales
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Precio Promedio Quintal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Fuente Precio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Monto a Pagar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPagos.map(pago => (
                            <tr key={pago.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex justify-center items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedPagos.includes(pago.id)}
                                            onChange={() => handleSelectPago(pago.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            disabled={
                                            pago.estado === 'CANCELADO' ||
                                            pago.estado === 'REALIZADO' ||
                                            (pago.estado === 'PENDIENTE' && pago.precio_promedio == null)
                                            }
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pago.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(pago.vencimiento)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hover:text-blue-500 hover:underline">
                                    <Link href={`/arrendamientos/${pago.arrendamiento.id}`}passHref>
                                        {pago.arrendamiento.id}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pago.quintales != null ? pago.quintales : (pago.participacion_arrendador?.porcentaje ? `${pago.participacion_arrendador.porcentaje}%` : '-')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pago.precio_promedio != null ? formatCurrency(pago.precio_promedio) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pago.fuente_precio ?? '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {pago.monto_a_pagar != null ? formatCurrency(pago.monto_a_pagar) : '-'}
                                </td>
                            </tr>
                        ))}
                            <tr className="bg-gray-100 font-semibold">
                                <td colSpan={4} className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">Totales pagos Pendientes:</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {paginatedPagos.reduce((acc, p) =>
                                    (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') ? acc + (p.quintales ?? 0) : acc, 0)}
                                </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(paginatedPagos.reduce((acc, p) =>
                                (p.estado === 'PENDIENTE' || p.estado === 'VENCIDO') ? acc + (p.monto_a_pagar ?? 0) : acc,0))}
                            </td>
                            <td className="px-6 py-4"></td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {selectedPagos.length > 0 && (
                <div className="pt-4">
                    <button
                    onClick={handleFacturarSeleccionados}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-2 transition-colors"
                    >
                    <FileText className="h-5 w-5" />
                    <span>Facturar seleccionado/s ({selectedPagos.length})</span>
                    </button>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    />
                </div>
            )}
            </div>
            <div className="flex justify-between mt-6">
                <Link href="/arrendadores" passHref>
                    <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                        Volver
                    </button>
                </Link>
                <div className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                <button onClick={handleDeleteArrendador} className="flex items-center space-x-3 px-3 py-2 w-full text-left text-base font-medium">
                    <Trash className="w-5 h-5" />
                    <span>Eliminar Arrendador</span>
                </button>
                </div>
            </div>
        </div>
        </div>
    </ProtectedRoute>
);
}
