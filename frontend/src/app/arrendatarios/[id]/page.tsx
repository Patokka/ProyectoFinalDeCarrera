"use client"

import { useState, useEffect, useMemo } from "react"
import { Edit, Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Pagination from "@/components/ui/Pagination"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import type { ArrendatarioDtoOut, FacturacionDtoOut } from "@/lib/type"
import {canEditOrDelete, formatCuit, formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth} from "@/lib/helpers"
import { fetchFacturacionesByArrendatario } from "@/lib/facturaciones/auth"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { deleteArrendatario, fetchArrendatarioById } from "@/lib/arrendatarios/auth"
import DateInput from "@/components/ui/DateInput"
import { useAuth } from "@/components/context/AuthContext"

const ITEMS_PER_PAGE = 5

export default function ArrendatarioDetailPage() {
    const params = useParams()
    const idArrendatario = params?.id
    const [arrendatario, setArrendatario] = useState<ArrendatarioDtoOut>()
    const [facturaciones, setFacturaciones] = useState<FacturacionDtoOut[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [fechaDesde, setFechaDesde] = useState(getFirstDayOfCurrentMonth())
    const [fechaHasta, setFechaHasta] = useState(getLastDayOfCurrentMonth())
    const { user } = useAuth();
    const canEditEliminate = canEditOrDelete(user?.rol);
    
    // Cargar arrendatario + facturaciones del mes actual
    useEffect(() => {
        const load = async () => {
        if (!idArrendatario) {
            setError("Id de arrendatario inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const arr = await fetchArrendatarioById(Number(idArrendatario))
            const facturacionesArr = await fetchFacturacionesByArrendatario(Number(idArrendatario))
            setArrendatario(arr)
            setFacturaciones(facturacionesArr)
        } catch (e: any) {
            toast.error("Error al cargar los datos del arrendatario")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idArrendatario])

    // Filtrado de facturaciones del mes actual
    const filteredFacturaciones = useMemo(() => {
        return facturaciones.filter((facturacion) => {
        const fecha = new Date(facturacion.fecha_facturacion)
        const desdeOk = !fechaDesde || fecha >= new Date(fechaDesde)
        const hastaOk = !fechaHasta || fecha <= new Date(fechaHasta)
        return desdeOk && hastaOk
        })
    }, [facturaciones, fechaDesde, fechaHasta])

    useEffect(() => {
        setCurrentPage(1)
    }, [fechaDesde, fechaHasta])
    // Paginación
    const totalPages = Math.ceil(filteredFacturaciones.length / ITEMS_PER_PAGE)
    const paginatedFacturaciones = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredFacturaciones.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredFacturaciones, currentPage])

    // Renderizado estados de UI
    if (loading) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del arrendatario...</p>
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

    if (!arrendatario) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
            <div className="text-center py-12 font-semibold text-gray-700">No se encontró el arrendatario</div>
            </div>
        </ProtectedRoute>
        )
    }

    function handleDeleteArrendatario() {
        const toastId = toast.info(`¿Está seguro que desea eliminar el arrendatario?`, {
        action: {
            label: "Confirmar",
            onClick: async () => {
            toast.dismiss(toastId)
            try {
                await deleteArrendatario(Number(idArrendatario))
                toast.success("Arrendatario eliminado con éxito, volviendo a la página de arrendatarios...")
                setTimeout(() => router.push("/arrendatarios"), 1000)
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
            <div className="bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">Detalle de Arrendatario</h1>
                        </div>
                        <Link href={`/arrendatarios/${arrendatario.id}/edit`} passHref>
                        <button className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${canEditEliminate ? "btn-primary cursor-pointer" : "bg-gray-200 font-medium text-gray-400 cursor-not-allowed"}`}
                                disabled={!canEditEliminate}>
                            <Edit className="h-4 w-4" />
                            <span>Editar Arrendatario</span>
                        </button>
                        </Link>
                    </div>

                    {/* Información del arrendatario */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Text label="Razón Social:" value={arrendatario.razon_social} readOnly={true} disabled={false} />
                        <Text label="CUIT:" value={formatCuit(arrendatario.cuit)} readOnly={true} disabled={false} />
                        <Text
                            label="Condición Fiscal:"
                            value={arrendatario.condicion_fiscal.replace(/_/g, " ")}
                            readOnly={true}
                            disabled={false}
                        />
                        <Text label="Mail:" value={arrendatario.mail? arrendatario.mail : '-'} readOnly={true} disabled={false} />
                        <Text
                            label="Localidad:"
                            value={`${arrendatario.localidad.nombre_localidad}, ${arrendatario.localidad.provincia.nombre_provincia}`}
                            readOnly={true}
                            disabled={false}
                        />
                        </div>
                    </div>

                    {/* Sección de facturaciones */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Facturaciones:</h2>
                        </div>
                        {/* Date filters section */}
                        <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
                            <div className="mb-3">
                                <h3 className="text-sm font-medium text-gray-700 underline">Filtrar:</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateInput value={fechaDesde} onChange={setFechaDesde} label="Desde" placeholder="Seleccionar fecha" />
                                <DateInput value={fechaHasta} onChange={setFechaHasta} label="Hasta" placeholder="Seleccionar fecha" />
                            </div>
                        </div>
                        {/* Tabla de facturaciones */}
                        <div className="overflow-x-auto">
                        {paginatedFacturaciones.length === 0 ? (
                            <div className="text-center py-12">
                            <p className="text-gray-500">No se encontraron facturaciones para el mes actual.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Número
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Arrendador
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Arrendamiento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Pago
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Tipo Factura
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Monto
                                </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedFacturaciones.map((facturacion) => (
                                <tr key={facturacion.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {facturacion.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(facturacion.fecha_facturacion)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {facturacion.arrendador.nombre_o_razon_social}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hover:text-blue-500 hover:underline">
                                        <Link href={`/arrendamientos/${facturacion.pago.arrendamiento.id}`} passHref>
                                            {facturacion.pago.arrendamiento.id}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hover:text-blue-500 hover:underline">
                                        <Link href={`/pagos/${facturacion.pago.id}`} passHref>
                                            {facturacion.pago.id}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {facturacion.tipo_factura}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(facturacion.monto_facturacion)}
                                    </td>
                                </tr>
                                ))}
                                {/* Renglón de totales */}
                                <tr className="bg-gray-100 font-semibold">
                                <td colSpan={6} className="px-6 py-3 text-sm text-gray-900">
                                    Total Facturado:
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900">
                                    {formatCurrency(paginatedFacturaciones.reduce((acc, f) => acc + f.monto_facturacion, 0))}
                                </td>
                                </tr>
                            </tbody>
                            </table>
                        )}
                        </div>

                        {totalPages > 1 && (
                        <div className="flex justify-center mt-4">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-between mt-6">
                        <Link href="/arrendatarios" passHref>
                            <button className="btn-secondary px-4 py-2 rounded-md transition-colors">Volver</button>
                        </Link>
                        <div className={`font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${canEditEliminate? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 cursor-pointer": "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                            <button onClick={handleDeleteArrendatario}
                                    disabled={!canEditEliminate}
                                    className={`flex items-center space-x-3 px-4 py-2 w-full text-left text-base font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`}>
                                        <Trash className="w-5 h-5" />
                                        <span>Eliminar Arrendatario</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
