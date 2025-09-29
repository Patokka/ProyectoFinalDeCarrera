"use client"

import { useState, useEffect, useMemo } from "react"
import { Edit, Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Pagination from "@/components/ui/Pagination"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import type {ArrendamientoDtoOut, PagoDtoOut, ParticipacionArrendador, EstadoArrendamiento, TipoArrendamiento, PlazoPago, TipoDiasPromedio, TipoOrigenPrecio, } from "@/lib/type"
import { formatCuit, formatCurrency, formatDate, formatDiasPromedio, formatEstado, formatPlazoPago, getEstadoBadgeColor, getPagoBadgeColor } from "@/lib/helpers"
import Text from "@/components/ui/Text"
import Link from "next/link"

const ITEMS_PER_PAGE = 6

    // Mock data para desarrollo
const mockArrendamiento: ArrendamientoDtoOut = {
    id: 1,
    estado: "ACTIVO" as EstadoArrendamiento,
    tipo: "FIJO" as TipoArrendamiento,
    localidad: {
        id: 1,
        nombre_localidad: "Rosario",
        provincia: {
        id: 1,
        nombre_provincia: "Santa Fe",
        },
    },
    usuario: {
        id: 1,
        cuil: "20123456789",
        nombre: "Juan",
        apellido: "Pérez",
        mail: "juan.perez@example.com",
        rol: "ADMINISTRADOR",
    },
    arrendatario: {
        id: 1,
        razon_social: "Agropecuaria Los Pinos S.A.",
        condicion_fiscal: "RESPONSABLE_INSCRIPTO",
        cuit: "30123456789",
        mail: "contacto@lospinos.com",
        localidad: {
        id: 2,
        nombre_localidad: "Venado Tuerto",
        provincia: {
            id: 1,
            nombre_provincia: "Santa Fe",
        },
        },
    },
    fecha_inicio: "2024-01-01",
    fecha_fin: "2025-12-31",
    quintales: 5000,
    hectareas: 250,
    plazo_pago: "TRIMESTRAL" as PlazoPago,
    dias_promedio: "ULTIMOS_5_HABILES" as TipoDiasPromedio,
    origen_precio: "BCR" as TipoOrigenPrecio,
    porcentaje_aparceria: 30,
    descripcion: "Arrendamiento de campo para cultivo de soja y maíz",
    arrendadores: [
        {
        id: 1,
        nombre_o_razon_social: "García, Roberto",
        cuil: "20987654321",
        condicion_fiscal: "MONOTRIBUTISTA",
        mail: "roberto.garcia@example.com",
        telefono: "341-1234567",
        localidad: {
            id: 1,
            nombre_localidad: "Rosario",
            provincia: {
            id: 1,
            nombre_provincia: "Santa Fe",
            },
        },
        descripcion: "Propietario principal",
        },
        {
        id: 2,
        nombre_o_razon_social: "Martínez, Ana",
        cuil: "27456789123",
        condicion_fiscal: "RESPONSABLE_INSCRIPTO",
        mail: "ana.martinez@example.com",
        telefono: "341-7654321",
        localidad: {
            id: 1,
            nombre_localidad: "Rosario",
            provincia: {
            id: 1,
            nombre_provincia: "Santa Fe",
            },
        },
        },
    ],
    }

const mockParticipaciones: ParticipacionArrendador[] = [
    {
        arrendador_id: 1,
        hectareas_asignadas: 150,
        quintales_asignados: 3000,
        porcentaje: 60,
        observacion: "Participación mayoritaria",
        arrendamiento_id: 1,
    },
    {
        arrendador_id: 2,
        hectareas_asignadas: 100,
        quintales_asignados: 2000,
        porcentaje: 40,
        observacion: "Participación minoritaria",
        arrendamiento_id: 1,
    },
    ]

    const mockPagos: PagoDtoOut[] = [
    {
        id: 1,
        estado: "REALIZADO",
        quintales: 750,
        precio_promedio: 45000,
        vencimiento: "2024-03-31",
        fuente_precio: "BCR",
        monto_a_pagar: 33750000,
        arrendamiento: mockArrendamiento,
        participacion_arrendador: mockParticipaciones[0],
    },
    {
        id: 2,
        estado: "REALIZADO",
        quintales: 750,
        precio_promedio: 46500,
        vencimiento: "2024-06-30",
        fuente_precio: "BCR",
        monto_a_pagar: 34875000,
        arrendamiento: mockArrendamiento,
        participacion_arrendador: mockParticipaciones[0],
    },
    {
        id: 3,
        estado: "PENDIENTE",
        quintales: 750,
        precio_promedio: 47200,
        vencimiento: "2024-09-30",
        fuente_precio: "BCR",
        monto_a_pagar: 35400000,
        arrendamiento: mockArrendamiento,
        participacion_arrendador: mockParticipaciones[0],
    },
    {
        id: 4,
        estado: "PENDIENTE",
        quintales: 750,
        vencimiento: "2024-12-31",
        arrendamiento: mockArrendamiento,
        participacion_arrendador: mockParticipaciones[0],
    },
    ]

export default function ArrendamientoDetailPage() {
    const params = useParams()
    const idArrendamiento = params?.id
    const [arrendamiento, setArrendamiento] = useState<ArrendamientoDtoOut>()
    const [participaciones, setParticipaciones] = useState<ParticipacionArrendador[]>([])
    const [pagos, setPagos] = useState<PagoDtoOut[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Cargar arrendamiento + participaciones + pagos
    useEffect(() => {
        const load = async () => {
        if (!idArrendamiento) {
            setError("Id de arrendamiento inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            // TODO: Reemplazar con llamadas reales a la API
            // const arr = await fetchArrendamientoById(Number(idArrendamiento));
            // const parts = await fetchParticipacionesByArrendamiento(Number(idArrendamiento));
            // const pagosArr = await fetchPagosByArrendamiento(Number(idArrendamiento));
            setArrendamiento(mockArrendamiento)
            setParticipaciones(mockParticipaciones)
            setPagos(mockPagos)
        } catch (e: any) {
            toast.error("Error al cargar los datos del arrendamiento")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [idArrendamiento])

    // Ordenar pagos por fecha ascendente (más vieja primero)
    const sortedPagos = useMemo(() => {
        return [...pagos].sort((a, b) => {
        const dateA = new Date(a.vencimiento)
        const dateB = new Date(b.vencimiento)
        return dateA.getTime() - dateB.getTime()
        })
    }, [pagos])

    // Paginación
    const totalPages = Math.ceil(sortedPagos.length / ITEMS_PER_PAGE)
    const paginatedPagos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return sortedPagos.slice(start, start + ITEMS_PER_PAGE)
    }, [sortedPagos, currentPage])

    // Renderizado estados de UI
    if (loading) {
        return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del arrendamiento...</p>
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

    if (!arrendamiento) {
        return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
            <div className="text-center py-12 font-semibold text-gray-700">No se encontró el arrendamiento</div>
            </div>
        </ProtectedRoute>
        )
    }

    function handleDeleteArrendamiento() {
        const toastId = toast.info(`¿Está seguro que desea eliminar el arrendamiento?`, {
        action: {
            label: "Confirmar",
            onClick: async () => {
            toast.dismiss(toastId)
            try {
                // TODO: await deleteArrendamiento(Number(idArrendamiento));
                toast.success("Arrendamiento eliminado con éxito, volviendo a la página de arrendamientos...")
                setTimeout(() => router.push("/arrendamientos"), 1000)
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Detalle de Arrendamiento</h1>
                    <span
                        className={`px-3 py-1 rounded-full text-md font-medium ${getEstadoBadgeColor(arrendamiento.estado)}`}
                    >
                        {formatEstado(arrendamiento.estado)}
                    </span>
                </div>
                <Link href={`/arrendamientos/${arrendamiento.id}/edit`} passHref>
                    <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                        <Edit className="h-4 w-4" />
                        <span>Editar Arrendamiento</span>
                    </button>
                </Link>
            </div>

            {/* Información del arrendamiento */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Información General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Text
                    label="Tipo de Arrendamiento:"
                    value={arrendamiento.tipo === "FIJO" ? "Fijo" : "A Porcentaje"}
                    readOnly={true}
                    disabled={false}
                />
                <Text
                    label="Arrendatario:"
                    value={arrendamiento.arrendatario.razon_social}
                    readOnly={true}
                    disabled={false}
                />
                <Text
                    label="Usuario Responsable:"
                    value={`${arrendamiento.usuario.nombre} ${arrendamiento.usuario.apellido}`}
                    readOnly={true}
                    disabled={false}
                />
                <Text
                    label="Localidad:"
                    value={`${arrendamiento.localidad.nombre_localidad}, ${arrendamiento.localidad.provincia.nombre_provincia}`}
                    readOnly={true}
                    disabled={false}
                />
                <Text
                    label="Fecha Inicio:"
                    value={formatDate(arrendamiento.fecha_inicio)}
                    readOnly={true}
                    disabled={false}
                />
                <Text label="Fecha Fin:" value={formatDate(arrendamiento.fecha_fin)} readOnly={true} disabled={false} />
                <Text label="Hectáreas:" value={arrendamiento.hectareas.toString()} readOnly={true} disabled={false} />
                <Text label="Quintales por Hectárea:" value={arrendamiento.quintales.toString()} readOnly={true} disabled={false} />
                <Text
                    label="Plazo de Pago:"
                    value={formatPlazoPago(arrendamiento.plazo_pago)}
                    readOnly={true}
                    disabled={false}
                />
                <Text
                    label="Días Promedio:"
                    value={formatDiasPromedio(arrendamiento.dias_promedio)}
                    readOnly={true}
                    disabled={false}
                />
                <Text label="Origen Precio:" value={arrendamiento.origen_precio} readOnly={true} disabled={false} />
                {arrendamiento.porcentaje_aparceria && arrendamiento.tipo == 'A_PORCENTAJE' && (
                    <Text
                    label="Porcentaje Aparcería:"
                    value={`${arrendamiento.porcentaje_aparceria}%`}
                    readOnly={true}
                    disabled={false}
                    />
                )}
                {arrendamiento.descripcion && (
                    <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                    <textarea
                        value={arrendamiento.descripcion}
                        readOnly
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    </div>
                )}
                </div>
            </div>

            {/* Tabla de Arrendadores */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Arrendadores y Participaciones</h2>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        CUIL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Hectáreas Asignadas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Quintales Asignados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Porcentaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Observación
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {participaciones.map((participacion) => {
                        const arrendador = arrendamiento.arrendadores.find((a) => a.id === participacion.arrendador_id)
                        return (
                        <tr key={participacion.arrendador_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {arrendador?.nombre_o_razon_social || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {arrendador ? formatCuit(arrendador.cuil) : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participacion.hectareas_asignadas} ha
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participacion.quintales_asignados} qq
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participacion.porcentaje}%
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{participacion.observacion || "-"}</td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Tabla de Pagos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>

                <div className="overflow-x-auto">
                {sortedPagos.length === 0 ? (
                    <div className="text-center py-12">
                    <p className="text-gray-500">No se encontraron pagos para este arrendamiento.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Vencimiento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Quintales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Precio Promedio
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
                        {paginatedPagos.map((pago) => (
                        <tr key={pago.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pago.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(pago.vencimiento)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPagoBadgeColor(pago.estado)}`}
                            >
                                {pago.estado}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.quintales != null ? `${pago.quintales} qq` : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.precio_promedio != null ? formatCurrency(pago.precio_promedio) : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.fuente_precio ?? "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {pago.monto_a_pagar != null ? formatCurrency(pago.monto_a_pagar) : "-"}
                            </td>
                        </tr>
                        ))}
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
                <Link href="/arrendamientos" passHref>
                <button className="btn-secondary px-4 py-2 rounded-md transition-colors">Volver</button>
                </Link>
                <div className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                <button
                    onClick={handleDeleteArrendamiento}
                    className="flex items-center space-x-3 px-3 py-2 w-full text-left text-base font-medium"
                >
                    <Trash className="w-5 h-5" />
                    <span>Eliminar Arrendamiento</span>
                </button>
                </div>
            </div>
            </div>
        </div>
        </ProtectedRoute>
    )
}
