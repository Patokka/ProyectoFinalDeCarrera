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

export default function FacturacionDetailPage() {
    const params = useParams()
    const idFacturacion = params?.id
    const [facturacion, setFacturacion] = useState<FacturacionDtoOut>()
    const [retencion, setRetencion] = useState<RetencionDtoOut  | null>()
    const [arrendador, setArrendador] = useState<ArrendadorDtoOut>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Cargar Facturación, retención si tiene y Arrendador
    useEffect(() => {
        const load = async () => {
        if (!idFacturacion) {
            setError("Id de Facturación inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const fac = await fetchFacturacionById(Number(idFacturacion))
            setFacturacion(fac)
            setArrendador(fac.arrendador)
            const ret = await fetchRetencionByFacturacionId(fac.id)
            setRetencion(ret)
        } catch (e: any) {
            toast.error("Error al cargar los datos de la facturación")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idFacturacion])

    // Renderizado estados de UI
    if (loading) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del facturacion...</p>
            </div>
        </ProtectedRoute>
        )
    }

    if (error) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
            </div>
        </ProtectedRoute>
        )
    }

    if (!facturacion) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="text-center py-12 font-semibold text-gray-700">No se encontró el facturacion</div>
            </div>
        </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-gray-900">Detalle de Facturación</h1>
                        </div>
                    </div>

                    {/* Información de la facturacion */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Text 
                            label="Número:" 
                            value={String(facturacion.id)} 
                            readOnly={true} 
                            disabled={false}/>
                        <Text 
                            label="Fecha de Facturación:"   
                            value={formatDate(facturacion.fecha_facturacion)} 
                            readOnly={true} 
                            disabled={false} />
                        <Text 
                            label="Tipo Factura:"   
                            value={facturacion.tipo_factura} 
                            readOnly={true} 
                            disabled={false} />
                        <Text
                            label="Arrendador:"
                            value={facturacion?.arrendador.nombre_o_razon_social}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="CUIT - CUIL del arrendador:"
                            value={arrendador?.cuil ? formatCuit(arrendador?.cuil) : '-'}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="Condición Fiscal del arrendador:"
                            value={arrendador?.condicion_fiscal ? arrendador.condicion_fiscal.replace(/_/g, ' ') : '-'}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="Monto de Pago:"
                            value={facturacion.pago.monto_a_pagar? formatCurrency(facturacion.pago.monto_a_pagar) : '-'}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="Monto Facturado:"
                            value={formatCurrency(facturacion.monto_facturacion)}
                            readOnly={true}
                            disabled={false}/>
                        {retencion && (
                            <>

                            <Text 
                                label="Número Retención:" 
                                value={String(retencion.id)} 
                                readOnly={true} 
                                disabled={false} />
                            <Text
                                label="Total Retención:"
                                value={formatCurrency(retencion.total_retencion)}
                                readOnly={true}
                                disabled={false}/>
                            <Text
                                label="Mínimo Imponible Retención:"
                                value={formatCurrency(retencion.monto_imponible)}
                                readOnly={true}
                                disabled={false}/>
                            <Text
                                label="Fecha de Retención:"
                                value={formatDate(retencion.fecha_retencion)}
                                readOnly={true}
                                disabled={false}/>
                            </>
                        )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-between mt-6">
                        <Link href="/facturaciones" passHref>
                            <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                                Volver
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
