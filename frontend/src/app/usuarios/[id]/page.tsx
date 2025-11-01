"use client"

import { useState, useEffect, useMemo } from "react"
import { Lock } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import { toast } from "sonner"
import type { UsuarioDtoOut } from "@/lib/type"
import {formatCuit} from "@/lib/helpers"
import CambiarContrasenaModal from "@/components/ui/CambiarContrasenaModal"
import Text from "@/components/ui/Text"
import Link from "next/link"
import { fetchUsuarioById } from "@/lib/usuarios/auth"

export default function UsuarioDetailPage() {
    const params = useParams()
    const idUsuario = params?.id
    const [usuario, setUsuario] = useState<UsuarioDtoOut>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const load = async () => {
        if (!idUsuario) {
            setError("Id de usuario inválido")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const usu = await fetchUsuarioById(Number(idUsuario))
            setUsuario(usu)
        } catch (e: any) {
            toast.error("Error al cargar los datos del usuario")
            setError("Error al cargar datos")
        } finally {
            setLoading(false)
        }
    }
    // Cargar usuario 
    useEffect(() => {
        load()
    }, [idUsuario])

    // Renderizado estados de UI
    if (loading) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6 flex items-center justify-center">
            <p className="text-gray-500">Cargando datos del usuario...</p>
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

    if (!usuario) {
        return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
            <div className="text-center py-12 font-semibold text-gray-700">No se encontró el usuario</div>
            </div>
        </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="bg-gray-50 p-6">
                <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Detalle de Usuario</h1>
                    </div>
                    <button 
                        className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                        onClick={() => {setIsModalOpen(true)}}>
                        <Lock className="h-4 w-4" />
                        <span>Cambiar Contraseña</span>
                    </button>
                </div>

                {/* Información del usuario */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Text label="Nombre:" 
                        value={usuario.nombre} 
                        readOnly={true} 
                        disabled={false} 
                    />
                    <Text 
                        label="Apellido:" 
                        value={usuario.apellido} 
                        readOnly={true} 
                        disabled={false} 
                    />
                    <Text
                        label="CUIT - CUIL:"
                        value={formatCuit(usuario.cuil)}
                        readOnly={true}
                        disabled={false}
                    />
                    <Text
                        label="Rol:"
                        value={usuario.rol}
                        readOnly={true}
                        disabled={false}
                    />
                    <Text 
                        label="Mail:" 
                        value={usuario.mail? usuario.mail : '-'} 
                        readOnly={true} 
                        disabled={false} 
                    />
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between mt-6">
                    <Link href="/dashboard" passHref>
                    <button className="btn-secondary px-4 py-2 rounded-md transition-colors">Volver</button>
                    </Link>
                </div>
                </div>
            </div>
            <CambiarContrasenaModal
                isOpen={isModalOpen}
                onClose={() =>{setIsModalOpen(false)}}
                onSuccess={load}
            />
        </ProtectedRoute>
    )
}
