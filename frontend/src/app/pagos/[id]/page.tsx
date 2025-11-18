"use client"

import { useState, useEffect } from "react"
import { FileText, Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import { PrecioDtoOut, type PagoDtoOut, type ParticipacionArrendadorDtoOut } from "@/lib/type"
import { canEditOrDelete, formatCurrency, formatDate, getPagoBadgeColor} from "@/lib/helpers"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { cancelarPago, facturarPago, fetchPagoById } from "@/lib/pagos/auth"
import { fetchPreciosPago } from "@/lib/precios/auth"
import { useAuth } from "@/components/context/AuthContext"

/**
 * @page PagoDetailPage
 * @description Página que muestra los detalles de un pago específico, incluyendo
 *              la información del arrendador, arrendatario y los precios utilizados
 *              para el cálculo del monto si aplica.
 * @returns {JSX.Element} La vista de detalle del pago.
 */
export default function PagoDetailPage() {
    const params = useParams()
    const idPago = params?.id
    const [pago, setPago] = useState<PagoDtoOut>()
    const [participacion, setParticipacion] = useState<ParticipacionArrendadorDtoOut>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [precios, setPrecios] = useState<PrecioDtoOut[]>([])
    const { user } = useAuth();
    const canEditEliminate = canEditOrDelete(user?.rol);

    /**
     * @effect
     * @description Carga los datos del pago y los precios asociados al montar el componente.
     */
    useEffect(() => {
        const load = async () => {
        if (!idPago) return setError("Id de Pago inválido");
        try {
            setLoading(true)
            const pag = await fetchPagoById(Number(idPago));
            const pre = await fetchPreciosPago(Number(idPago));
            setPrecios(pre)
            setPago(pag)
            setParticipacion(pag.participacion_arrendador)
        } catch (e: any) {
            toast.error("Error al cargar los datos del pago")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idPago])

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!pago) return <ProtectedRoute><div className="p-6 text-center">No se encontró el pago.</div></ProtectedRoute>;

    /**
     * @function handleCancelarPago
     * @description Muestra una confirmación y cancela el pago actual.
     */
    function handleCancelarPago() {
        toast.info(`¿Está seguro que desea cancelar el pago?`, {
            action: { label: "Confirmar", onClick: async () => {
                try {
                    await cancelarPago(Number(idPago));
                    toast.success("Pago cancelado con éxito.");
                    window.location.reload();
                } catch (e: any) {
                    toast.error(e.message);
                }
            }},
            duration: 5000,
        })
    }

    /**
     * @function handleFacturarPago
     * @description Muestra una confirmación y factura el pago actual.
     */
    function handleFacturarPago() {
        toast.info(`¿Está seguro que desea facturar el pago?`, {
            action: { label: "Confirmar", onClick: async () => {
                if (!idPago) return toast.error("Pago inválido");
                try {
                    await facturarPago(Number(idPago));
                    toast.success("Pago facturado con éxito.");
                    window.location.reload();
                } catch (e: any) {
                    toast.error(e.message || "Error al facturar");
                }
            }},
            duration: 5000,
        })
    }

    return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold">Detalle de Pago</h1>
                            <span className={`badge ${getPagoBadgeColor(pago.estado)}`}>{pago.estado}</span>
                        </div>
                        {canEditEliminate && (pago.estado === 'PENDIENTE' || pago.estado === 'VENCIDO') &&
                            <button className="btn-green" onClick={handleFacturarPago}>
                                <FileText size={16} /><span>Facturar Pago</span>
                            </button>
                        }
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Text label="Número:" value={String(pago.id)} />
                            <Text label="Vencimiento:" value={formatDate(pago.vencimiento)} />
                            <Text label="Origen Precio:" value={pago.fuente_precio || '-'} />
                            <Text label="Arrendador:" value={participacion?.arrendador.nombre_o_razon_social || '-'} />
                            <Text label="Cond. Fiscal:" value={participacion?.arrendador.condicion_fiscal.replace(/_/g, ' ') || '-'} />
                            <Text label="Arrendatario:" value={pago.arrendamiento.arrendatario.razon_social} />

                            {pago?.porcentaje ? <Text label="Porcentaje Producción:" value={`${pago.porcentaje}%`} /> : null}

                            {pago?.monto_a_pagar != null && (
                                <>
                                    <Text label="Precio Promedio Quintal:" value={pago.precio_promedio ? formatCurrency(pago.precio_promedio) : '-'} />
                                    <Text label="Hectáreas:" value={participacion?.hectareas_asignadas ? `${participacion.hectareas_asignadas} ha` : '-'} />
                                    <Text label="Quintales/ha:" value={participacion?.quintales_asignados ? `${participacion.quintales_asignados} qq` : '-'} />
                                    <Text label="Total Quintales a pagar:" value={pago.quintales ? `${pago.quintales} qq` : '-'} />
                                    <Text label="Monto:" value={formatCurrency(pago.monto_a_pagar)} />
                                </>
                            )}

                            {precios.length > 0 && (
                                <div className="md:col-span-2 lg:col-span-3 mt-4">
                                    <label className="label-class mb-2">Precios utilizados para el promedio:</label>
                                    <div className="max-h-96 overflow-y-auto border rounded-md p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {precios.map((p, i) => <div key={i} className="bg-gray-100 px-2 py-1 rounded-md flex justify-between text-sm"><span>{formatDate(p.fecha_precio)}:</span><span>{formatCurrency(p.precio_obtenido)}</span></div>)}
                                    </div>
                                </div>
                            )}

                            {participacion?.observacion && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="label-class mb-1">Observación:</label>
                                    <textarea value={participacion.observacion} readOnly rows={3} className="input-field" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between mt-6">
                        <Link href="/pagos"><button className="btn-secondary">Volver</button></Link>
                        {canEditEliminate && pago.estado !== 'REALIZADO' && pago.estado !== 'CANCELADO' &&
                            <button onClick={handleCancelarPago} className="btn-danger">
                                <Trash size={16} /><span>Cancelar Pago</span>
                            </button>
                        }
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
