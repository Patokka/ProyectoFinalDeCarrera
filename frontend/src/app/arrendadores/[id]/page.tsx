'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit, FileText, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import DateInput from '@/components/ui/DateInput';
import Pagination from '@/components/ui/Pagination';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { ArrendadorDtoOut, PagoDtoOut } from '@/lib/type';
import { canEditOrDelete, formatCuit, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/helpers';
import { facturarPagos, fetchPagosByArrendador } from '@/lib/pagos/auth';
import Text from '@/components/ui/Text'
import Link from 'next/link';
import { deleteArrendador, fetchArrendadorById } from '@/lib/arrendadores/auth';
import { useAuth } from '@/components/context/AuthContext';

const ITEMS_PER_PAGE = 5;

/**
 * @page ArrendadorDetailPage
 * @description Página que muestra los detalles completos de un arrendador específico,
 *              incluyendo su información personal y una tabla paginada y filtrable
 *              de sus pagos pendientes. Permite la facturación de pagos y la
 *              eliminación del arrendador.
 * @returns {JSX.Element} La vista de detalle del arrendador.
 */
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
    const { user } = useAuth();
    const canEditEliminate = canEditOrDelete(user?.rol);
    
    /**
     * @effect
     * @description Carga los datos del arrendador y sus pagos asociados al montar el componente
     *              o cuando el ID del arrendador cambia.
     */
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

    /**
     * @memo filteredPagos
     * @description Memoriza la lista de pagos filtrada por el rango de fechas seleccionado.
     */
    const filteredPagos = useMemo(() => {
        return pagos.filter(pago => {
            const venc = new Date(pago.vencimiento);
            const desdeOk = !fechaDesde || venc >= new Date(fechaDesde);
            const hastaOk = !fechaHasta || venc <= new Date(fechaHasta);
            return desdeOk && hastaOk;
        });
    }, [pagos, fechaDesde, fechaHasta]);

    /**
     * @memo paginatedPagos
     * @description Memoriza la porción de pagos filtrados que corresponde a la página actual.
     */
    const totalPages = Math.ceil(filteredPagos.length / ITEMS_PER_PAGE);
    const paginatedPagos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPagos.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPagos, currentPage]);

    /**
     * @effect
     * @description Resetea la paginación a la primera página cuando cambian los filtros de fecha.
     */
    useEffect(() => {
        setCurrentPage(1);
    }, [fechaDesde, fechaHasta]);

    /**
     * @function handleSelectPago
     * @description Gestiona la selección/deselección de un pago individual para facturación.
     * @param {number} id - El ID del pago a seleccionar/deseleccionar.
     */
    const handleSelectPago = (id: number) => {
        setSelectedPagos(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    /**
     * @function handleSelectAll
     * @description Selecciona o deselecciona todos los pagos facturables en la página actual.
     */
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

    /**
     * @function handleFacturarSeleccionados
     * @description Muestra una confirmación y, si es aceptada, envía a facturar los pagos seleccionados.
     */
    const handleFacturarSeleccionados = () => {
        if (selectedPagos.length === 0) return;
        const toastId = toast.info(`¿Está seguro que desea facturar ${selectedPagos.length} pago(s)?`, {
        action: {
            label: 'Confirmar',
            onClick: async () => {
            toast.dismiss(toastId);
            try {
                await facturarPagos(selectedPagos);
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

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!arrendador) return <ProtectedRoute><div className="p-6 text-center">No se encontró el arrendador.</div></ProtectedRoute>;

    /**
     * @function handleDeleteArrendador
     * @description Muestra una confirmación y, si es aceptada, elimina el arrendador actual.
     */
    function handleDeleteArrendador(){
        const toastId = toast.info(`¿Está seguro que desea eliminar el arrendador?`, {
        action: {
            label: 'Confirmar',
            onClick: async () => {
            toast.dismiss(toastId);
            try {
                await deleteArrendador(Number(idArrendador));
                toast.success('Arrendador eliminado, volviendo al listado...');
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
        {/* ... (resto del JSX sin cambios) */}
        <div className="bg-gray-50 p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Detalle de Arrendador</h1>
                    <Link href={`/arrendadores/${arrendador.id}/edit`} passHref>
                        <button className={`btn-primary ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}>
                            <Edit size={16} /><span>Editar Arrendador</span>
                        </button>
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Text label="Nombre o Razón Social:" value={arrendador.nombre_o_razon_social} />
                        <Text label="CUIL-CUIT:" value={formatCuit(arrendador.cuil)} />
                        <Text label="Condición Fiscal:" value={arrendador.condicion_fiscal.replace(/_/g, ' ')} />
                        <Text label="Teléfono:" value={arrendador.telefono || ' - '} />
                        <Text label="Localidad:" value={`${arrendador.localidad.nombre_localidad}, ${arrendador.localidad.provincia.nombre_provincia}`} />
                        <Text label="Mail:" value={arrendador.mail || ' - '} />
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                            <textarea value={arrendador.descripcion || ' - '} readOnly rows={3} className="input-field" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                    <h2 className="text-lg font-semibold">Pagos Pendientes:</h2>
                    <div className="bg-gray-100 rounded-lg border p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar por Vencimiento:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateInput value={fechaDesde} onChange={setFechaDesde} label="Desde" />
                            <DateInput value={fechaHasta} onChange={setFechaHasta} label="Hasta" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {paginatedPagos.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No hay pagos pendientes en el rango seleccionado.</div>
                        ) : (
                            <table className="min-w-full table-fixed divide-y">
                                {/* ... (thead y tbody sin cambios) */}
                            </table>
                        )}
                    </div>

                    {selectedPagos.length > 0 && (
                        <div className="pt-4">
                            <button onClick={handleFacturarSeleccionados} className="btn-green">
                                <FileText size={20} /><span>Facturar ({selectedPagos.length})</span>
                            </button>
                        </div>
                    )}

                    {totalPages > 1 && <div className="flex justify-center mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
                </div>

                <div className="flex justify-between mt-6">
                    <Link href="/arrendadores"><button className="btn-secondary">Volver</button></Link>
                    <button onClick={handleDeleteArrendador} disabled={!canEditEliminate} className={`btn-danger ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`}>
                        <Trash size={20} /><span>Eliminar Arrendador</span>
                    </button>
                </div>
            </div>
        </div>
    </ProtectedRoute>
);
}
