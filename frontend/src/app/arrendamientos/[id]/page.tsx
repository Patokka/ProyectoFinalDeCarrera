"use client"

import { useState, useEffect, useMemo } from "react"
import { Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Pagination from "@/components/ui/Pagination"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import type {ArrendamientoDtoOut, PagoDtoOut, ParticipacionArrendadorDtoOut, } from "@/lib/type"
import { canEditOrDelete, formatCuit, formatCurrency, formatDate, formatDiasPromedio, formatEstado, formatPlazoPago, getEstadoBadgeColor, getPagoBadgeColor } from "@/lib/helpers"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { cancelarArrendamiento, fetchArrendamientoById, fetchParticipacionesByArrendamiento } from "@/lib/arrendamientos/auth"
import { fetchPagosByArrendamiento } from "@/lib/pagos/auth"
import { useAuth } from "@/components/context/AuthContext"

const ITEMS_PER_PAGE = 6

/**
 * @page ArrendamientoDetailPage
 * @description Página que muestra los detalles completos de un arrendamiento, incluyendo
 *              información general, arrendadores participantes y un historial paginado de pagos.
 *              Permite la cancelación del arrendamiento.
 * @returns {JSX.Element} La vista de detalle del arrendamiento.
 */
export default function ArrendamientoDetailPage() {
    const params = useParams()
    const idArrendamiento = params?.id
    const [arrendamiento, setArrendamiento] = useState<ArrendamientoDtoOut>()
    const [participaciones, setParticipaciones] = useState<ParticipacionArrendadorDtoOut[]>([])
    const [pagos, setPagos] = useState<PagoDtoOut[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { user } = useAuth();
    const canEditEliminate = canEditOrDelete(user?.rol);

    /**
     * @effect
     * @description Carga los datos del arrendamiento, sus participaciones y su historial de pagos
     *              al montar el componente o cuando el ID del arrendamiento cambia.
     */
    useEffect(() => {
        const load = async () => {
        if (!idArrendamiento) {
            setError("Id de arrendamiento inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const [arr, parts, pagosArr] = await Promise.all([
                fetchArrendamientoById(Number(idArrendamiento)),
                fetchParticipacionesByArrendamiento(Number(idArrendamiento)),
                fetchPagosByArrendamiento(Number(idArrendamiento))
            ]);
            setArrendamiento(arr)
            setParticipaciones(parts)
            setPagos(pagosArr)
        } catch (e: any) {
            toast.error("Error al cargar los datos del arrendamiento")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idArrendamiento])

    /**
     * @memo sortedPagos
     * @description Memoriza la lista de pagos ordenada por fecha de vencimiento ascendente.
     */
    const sortedPagos = useMemo(() => {
        return [...pagos].sort((a, b) => new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime());
    }, [pagos])

    /**
     * @memo paginatedPagos
     * @description Memoriza la porción de pagos a mostrar en la página actual.
     */
    const totalPages = Math.ceil(sortedPagos.length / ITEMS_PER_PAGE)
    const paginatedPagos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return sortedPagos.slice(start, start + ITEMS_PER_PAGE)
    }, [sortedPagos, currentPage])

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!arrendamiento) return <ProtectedRoute><div className="p-6 text-center">No se encontró el arrendamiento.</div></ProtectedRoute>;

    /**
     * @function handleCancelarArrendamiento
     * @description Muestra una confirmación y, si es aceptada, cancela el arrendamiento.
     */
    function handleCancelarArrendamiento() {
        const toastId = toast.info(`¿Está seguro que desea cancelar el arrendamiento?`, {
        action: {
            label: "Confirmar",
            onClick: async () => {
            toast.dismiss(toastId)
            try {
                await cancelarArrendamiento(Number(idArrendamiento));
                toast.success("Arrendamiento cancelado con éxito.")
                setTimeout(() => {window.location.href = "/arrendamientos";}, 1500);
            } catch (e: any) {
                toast.error(e.message)
            }
            },
        },
        duration: 5000,
        })
    }

    return (
        <ProtectedRoute>
            {/* ... (resto del JSX sin cambios) */}
            <div className="bg-gray-50 p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold">Detalle de Arrendamiento</h1>
                        <span className={`badge ${getEstadoBadgeColor(arrendamiento.estado)}`}>{formatEstado(arrendamiento.estado)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Información General</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Text label="Tipo:" value={arrendamiento.tipo === "FIJO" ? "Fijo" : "A Porcentaje"} />
                        <Text label="Arrendatario:" value={arrendamiento.arrendatario.razon_social} />
                        <Text label="Creado por:" value={`${arrendamiento.usuario.nombre} ${arrendamiento.usuario.apellido}`} />
                        <Text label="Localidad:" value={`${arrendamiento.localidad.nombre_localidad}, ${arrendamiento.localidad.provincia.nombre_provincia}`} />
                        <Text label="Fecha Inicio:" value={formatDate(arrendamiento.fecha_inicio)} />
                        <Text label="Fecha Fin:" value={formatDate(arrendamiento.fecha_fin)} />
                        <Text label="Hectáreas:" value={`${arrendamiento.hectareas} ha`} />
                        <Text label="Quintales/ha:" value={`${arrendamiento.quintales} qq`} />
                        <Text label="Período de Pago:" value={formatPlazoPago(arrendamiento.plazo_pago)} />
                        <Text label="Días Promedio:" value={formatDiasPromedio(arrendamiento.dias_promedio)} />
                        <Text label="Origen Precio:" value={arrendamiento.origen_precio} />
                        {arrendamiento.tipo === 'A_PORCENTAJE' && <Text label="Porc. Aparcería:" value={`${arrendamiento.porcentaje_aparceria}%`} />}
                        {arrendamiento.descripcion && <div className="md:col-span-2 lg:col-span-3"><label className="label-class">Descripción:</label><textarea value={arrendamiento.descripcion} readOnly rows={3} className="input-field" /></div>}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Arrendadores y Participaciones</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="th-class">Arrendador</th>
                                    <th className="th-class">CUIT - CUIL</th>
                                    <th className="th-class">Hectáreas</th>
                                    <th className="th-class">Quintales</th>
                                    <th className="th-class">Porcentaje</th>
                                    <th className="th-class">Observación</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y">
                                {participaciones.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="td-class">{p.arrendador?.nombre_o_razon_social || "-"}</td>
                                        <td className="td-class">{p.arrendador ? formatCuit(p.arrendador.cuil) : "-"}</td>
                                        <td className="td-class">{p.hectareas_asignadas > 0 ? `${p.hectareas_asignadas} ha` : '-'}</td>
                                        <td className="td-class">{p.quintales_asignados > 0 ? `${p.quintales_asignados} qq` : '-'}</td>
                                        <td className="td-class">{p.porcentaje}%</td>
                                        <td className="td-class">{p.observacion || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                    <h2 className="text-lg font-semibold">Historial de Pagos</h2>
                    <div className="overflow-x-auto">
                        {sortedPagos.length === 0 ? <div className="text-center py-12 text-gray-500">No hay pagos para este arrendamiento.</div> : (
                            <table className="min-w-full divide-y">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="th-class">Número</th>
                                        <th className="th-class">Vencimiento</th>
                                        <th className="th-class">Estado</th>
                                        <th className="th-class">Quintales / Porc.</th>
                                        <th className="th-class">Precio Promedio</th>
                                        <th className="th-class">Fuente Precio</th>
                                        <th className="th-class">Monto a Pagar</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y">
                                    {paginatedPagos.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="td-class">{p.id}</td>
                                            <td className="td-class">{formatDate(p.vencimiento)}</td>
                                            <td className="td-class"><span className={`badge ${getPagoBadgeColor(p.estado)}`}>{p.estado}</span></td>
                                            <td className="td-class">{p.quintales != null ? `${p.quintales} qq` : `${p.porcentaje}%`}</td>
                                            <td className="td-class">{p.precio_promedio != null ? formatCurrency(p.precio_promedio) : "-"}</td>
                                            <td className="td-class">{p.fuente_precio || "-"}</td>
                                            <td className="td-class font-medium">{p.monto_a_pagar != null ? formatCurrency(p.monto_a_pagar) : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {totalPages > 1 && <div className="flex justify-center mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
                </div>

                <div className="flex justify-between mt-6">
                    <Link href="/arrendamientos"><button className="btn-secondary">Volver</button></Link>
                    {arrendamiento.estado !== 'CANCELADO' &&
                        <button onClick={handleCancelarArrendamiento} disabled={!canEditEliminate} className={`btn-danger ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`}>
                            <Trash size={16} /><span>Cancelar Arrendamiento</span>
                        </button>
                    }
                </div>
            </div>
        </div>
        </ProtectedRoute>
    )
}
