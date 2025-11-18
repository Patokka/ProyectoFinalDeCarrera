"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import { ArrendadorDtoOut, type FacturacionDtoOut, type RetencionDtoOut } from "@/lib/type"
import { formatCuit, formatCurrency, formatDate, getPagoBadgeColor} from "@/lib/helpers"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { fetchFacturacionById } from "@/lib/facturaciones/auth"
import { fetchRetencionByFacturacionId } from "@/lib/retenciones/auth"

/**
 * @page FacturacionDetailPage
 * @description Página que muestra los detalles de una facturación específica, incluyendo
 *              los datos de la retención asociada si existe.
 * @returns {JSX.Element} La vista de detalle de la facturación.
 */
export default function FacturacionDetailPage() {
    const params = useParams()
    const idFacturacion = params?.id
    const [facturacion, setFacturacion] = useState<FacturacionDtoOut>()
    const [retencion, setRetencion] = useState<RetencionDtoOut  | null>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * @effect
     * @description Carga los datos de la facturación y su retención asociada al montar el componente.
     */
    useEffect(() => {
        const load = async () => {
        if (!idFacturacion) {
            setError("Id de Facturación inválido")
            return;
        }
        try {
            setLoading(true)
            const fac = await fetchFacturacionById(Number(idFacturacion));
            setFacturacion(fac)
            const ret = await fetchRetencionByFacturacionId(fac.id);
            setRetencion(ret)
        } catch (e: any) {
            toast.error("Error al cargar los datos")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idFacturacion])

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!facturacion) return <ProtectedRoute><div className="p-6 text-center">No se encontró la facturación.</div></ProtectedRoute>;

    return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Detalle de Facturación</h1>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Text label="Número:" value={String(facturacion.id)} />
                            <Text label="Fecha:" value={formatDate(facturacion.fecha_facturacion)} />
                            <Text label="Tipo Factura:" value={facturacion.tipo_factura} />
                            <Text label="Arrendador:" value={facturacion.arrendador.nombre_o_razon_social} />
                            <Text label="CUIT Arrendador:" value={formatCuit(facturacion.arrendador.cuil)} />
                            <Text label="Cond. Fiscal Arrendador:" value={facturacion.arrendador.condicion_fiscal.replace(/_/g, " ")} />
                            <Text label="Monto de Pago:" value={facturacion.pago.monto_a_pagar ? formatCurrency(facturacion.pago.monto_a_pagar) : '-'} />
                            <Text label="Monto Facturado:" value={formatCurrency(facturacion.monto_facturacion)} />
                            {retencion && (
                                <>
                                    <Text label="Número Retención:" value={String(retencion.id)} />
                                    <Text label="Total Retención:" value={formatCurrency(retencion.total_retencion)} />
                                    <Text label="Mínimo Imponible:" value={formatCurrency(retencion.monto_imponible)} />
                                    <Text label="Fecha Retención:" value={formatDate(retencion.fecha_retencion)} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/facturaciones"><button className="btn-secondary">Volver</button></Link>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
