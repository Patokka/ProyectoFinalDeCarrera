"use client"

import { useState, useEffect, useMemo } from "react"
import { FileText, Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import type { PagoDtoOut, ParticipacionArrendadorDtoOut } from "@/lib/type"
import { formatCurrency, formatDate, getPagoBadgeColor} from "@/lib/helpers"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { cancelarPago, facturarPago, fetchPagoById } from "@/lib/pagos/auth"

export default function PagoDetailPage() {
    const params = useParams()
    const idPago = params?.id
    const [pago, setPago] = useState<PagoDtoOut>()
    const [participacion, setParticipacion] = useState<ParticipacionArrendadorDtoOut>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Cargar Pago y su correspondiente Participación
    useEffect(() => {
        const load = async () => {
        if (!idPago) {
            setError("Id de Pago inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const pag = await fetchPagoById(Number(idPago))
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

    // Renderizado estados de UI
    if (loading) {
        return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del pago...</p>
            </div>
        </ProtectedRoute>
        )
    }

    if (error) {
        return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
            </div>
        </ProtectedRoute>
        )
    }

    if (!pago) {
        return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12 font-semibold text-gray-700">No se encontró el pago</div>
            </div>
        </ProtectedRoute>
        )
    }

    function handleCancelarPago() {
        const toastId = toast.info(`¿Está seguro que desea cancelar el pago?`, {
        action: {
            label: "Confirmar",
            onClick: async () => {
            toast.dismiss(toastId)
            try {
                await cancelarPago(Number(idPago))
                toast.success("Pago cancelado con éxito, volviendo a la página de pagos...")
                setTimeout(() => router.push("/pagos"), 1000)
            } catch (e: any) {
                toast.error(e.message)
            }
            },
        },
        duration: 5000,
        })
    }

    function handleFacturarPago() {
        const toastId = toast.info(`¿Está seguro que desea facturar el pago?`, {
            action: {
                label: "Confirmar",
                onClick: async () => {
                    toast.dismiss(toastId)
                    if (!idPago) {
                        toast.error("Pago inválido")
                        return
                    }

                    try {
                        await facturarPago(Number(idPago))
                        toast.success("Pago facturado con éxito")
                        //Recarga completa de la ventana, para que el sidebar también se actualice
                        window.location.reload()
                    } catch (e: any) {
                        toast.error(e.message || "Error al facturar el pago")
                    }
                },
            },
            duration: 5000,
        })
    }


    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-gray-900">Detalle de Pago</h1>
                            <span className={`px-3 py-1 rounded-full text-md font-medium ${getPagoBadgeColor(pago.estado)}`}>
                                    {pago.estado}
                            </span>
                        </div>
                        {(pago.estado == 'PENDIENTE' ||pago.estado == 'VENCIDO') &&
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                                    onClick={handleFacturarPago}>             
                                <FileText className="h-4 w-4" />
                                <span>Facturar Pago</span>
                            </button>
                        }
                    </div>

                    {/* Información del pago */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Text 
                            label="Número:" 
                            value={String(pago.id)} 
                            readOnly={true} 
                            disabled={false}/>
                        <Text 
                            label="Vencimiento:"   
                            value={formatDate(pago.vencimiento)} 
                            readOnly={true} 
                            disabled={false} />
                        <Text 
                            label="Origen Precio:"   
                            value={pago.fuente_precio? pago.fuente_precio : '-'} 
                            readOnly={true} 
                            disabled={false} />
                        <Text
                            label="Arrendador:"
                            value={participacion?.arrendador.nombre_o_razon_social ? participacion.arrendador.nombre_o_razon_social : '-'}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="Condición Fiscal arrendador:"
                            value={participacion?.arrendador.condicion_fiscal ? participacion.arrendador.condicion_fiscal.replace('_', ' ') : '-'}
                            readOnly={true}
                            disabled={false}/>
                        <Text
                            label="Porcentaje de Producción a entregar:"
                            value={participacion? participacion.porcentaje + '%' : ''}
                            readOnly={true}
                            disabled={false}/>
                        {pago?.monto_a_pagar && (
                            <>
                            <Text 
                                label="Precio Promedio Quintal:" 
                                value={pago.precio_promedio? formatCurrency(pago.precio_promedio) : 'Se calculará automáticamente cuando se tengan los precios necesarios'} 
                                readOnly={true} 
                                disabled={false} />
                            <Text
                                label="Hectáreas:"
                                value={participacion?.hectareas_asignadas ? participacion.hectareas_asignadas+' ha' : '-'}
                                readOnly={true}
                                disabled={false}/>
                            <Text
                                label="Quintales por Hectárea:"
                                value={participacion?.quintales_asignados ? participacion.quintales_asignados  + ' qq': '-'}
                                readOnly={true}
                                disabled={false}/>
                            <Text
                                label="Total Quintales a pagar:"
                                value={pago.quintales? pago.quintales + ' qq' : '-'}
                                readOnly={true}
                                disabled={false}/>
                            <Text
                                label="Monto:"
                                value={pago.monto_a_pagar? formatCurrency(pago.monto_a_pagar) : 'Se calculará cuando el precio promedio esté disponible'}
                                readOnly={true}
                                disabled={false}/>
                            </>
                        )}
                        {participacion?.observacion && (
                            <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                            <textarea
                                value={participacion.observacion}
                                readOnly
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-between mt-6">
                        <Link href="/pagos" passHref>
                            <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                                Volver
                            </button>
                        </Link>
                        {pago.estado!='REALIZADO' &&
                            <div className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                                <button
                                    onClick={handleCancelarPago}
                                    className="flex items-center space-x-3 px-3 py-2 w-full text-left text-base font-medium"
                                >
                                    <Trash className="w-5 h-5" />
                                    <span>Cancelar Pago</span>
                                </button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
