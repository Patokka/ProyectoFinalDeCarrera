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

/**
 * @page ArrendatarioDetailPage
 * @description Página que muestra los detalles de un arrendatario, incluyendo su información
 *              y un historial paginado y filtrable de sus facturaciones.
 * @returns {JSX.Element} La vista de detalle del arrendatario.
 */
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
    
    /**
     * @effect
     * @description Carga los datos del arrendatario y su historial de facturaciones
     *              al montar el componente.
     */
    useEffect(() => {
        const load = async () => {
            if (!idArrendatario) {
                setError("Id de arrendatario inválido")
                return;
            }
            try {
                setLoading(true)
                const [arr, facturacionesArr] = await Promise.all([
                    fetchArrendatarioById(Number(idArrendatario)),
                    fetchFacturacionesByArrendatario(Number(idArrendatario))
                ]);
                setArrendatario(arr)
                setFacturaciones(facturacionesArr)
            } catch (e: any) {
                toast.error("Error al cargar los datos")
                setError("Error al cargar datos")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [idArrendatario])

    /**
     * @memo filteredFacturaciones
     * @description Memoriza la lista de facturaciones filtrada por el rango de fechas.
     */
    const filteredFacturaciones = useMemo(() => {
        return facturaciones.filter(f => {
            const fecha = new Date(f.fecha_facturacion);
            return (!fechaDesde || fecha >= new Date(fechaDesde)) && (!fechaHasta || fecha <= new Date(fechaHasta));
        });
    }, [facturaciones, fechaDesde, fechaHasta])

    /**
     * @effect
     * @description Resetea la paginación cuando cambian los filtros.
     */
    useEffect(() => {
        setCurrentPage(1)
    }, [fechaDesde, fechaHasta])

    /**
     * @memo paginatedFacturaciones
     * @description Memoriza la porción de facturaciones a mostrar en la página actual.
     */
    const totalPages = Math.ceil(filteredFacturaciones.length / ITEMS_PER_PAGE)
    const paginatedFacturaciones = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredFacturaciones.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredFacturaciones, currentPage])

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!arrendatario) return <ProtectedRoute><div className="p-6 text-center">No se encontró el arrendatario.</div></ProtectedRoute>;

    /**
     * @function handleDeleteArrendatario
     * @description Muestra una confirmación y elimina el arrendatario actual.
     */
    function handleDeleteArrendatario() {
        toast.info(`¿Está seguro que desea eliminar el arrendatario?`, {
            action: {
                label: "Confirmar",
                onClick: async () => {
                    try {
                        await deleteArrendatario(Number(idArrendatario))
                        toast.success("Arrendatario eliminado con éxito.")
                        router.push("/arrendatarios");
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
                        <h1 className="text-2xl font-bold">Detalle de Arrendatario</h1>
                        <Link href={`/arrendatarios/${arrendatario.id}/edit`}>
                            <button className={`btn-primary ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`} disabled={!canEditEliminate}>
                                <Edit size={16} /><span>Editar Arrendatario</span>
                            </button>
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Text label="Razón Social:" value={arrendatario.razon_social} />
                            <Text label="CUIT:" value={formatCuit(arrendatario.cuit)} />
                            <Text label="Condición Fiscal:" value={arrendatario.condicion_fiscal.replace(/_/g, " ")} />
                            <Text label="Mail:" value={arrendatario.mail || '-'} />
                            <Text label="Localidad:" value={`${arrendatario.localidad.nombre_localidad}, ${arrendatario.localidad.provincia.nombre_provincia}`} />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <h2 className="text-lg font-semibold">Facturaciones:</h2>
                        <div className="bg-gray-100 rounded-lg border p-4">
                            <h3 className="text-sm font-medium mb-3 underline">Filtrar por Fecha:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateInput value={fechaDesde} onChange={setFechaDesde} label="Desde" />
                                <DateInput value={fechaHasta} onChange={setFechaHasta} label="Hasta" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {paginatedFacturaciones.length === 0 ? <div className="text-center py-12 text-gray-500">No hay facturaciones en el rango seleccionado.</div> : (
                                <table className="min-w-full divide-y">
                                    {/* ... (thead y tbody sin cambios) */}
                                </table>
                            )}
                        </div>
                        {totalPages > 1 && <div className="flex justify-center mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
                    </div>

                    <div className="flex justify-between mt-6">
                        <Link href="/arrendatarios"><button className="btn-secondary">Volver</button></Link>
                        <button onClick={handleDeleteArrendatario} disabled={!canEditEliminate} className={`btn-danger ${!canEditEliminate && 'cursor-not-allowed opacity-50'}`}>
                            <Trash size={16} /><span>Eliminar Arrendatario</span>
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
