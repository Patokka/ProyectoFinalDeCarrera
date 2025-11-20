"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, FileDown } from "lucide-react"
import { toast } from "sonner"
import { Option } from "@/lib/type"
import { fetchReporteArrendador } from "@/lib/reportes/auth"
import { fetchArrendadores } from "@/lib/arrendadores/auth"
import DateInput from "./DateInput"
import { ArrendadorSelect } from "./ArrendadorSelect"

/**
 * @interface HistorialPagosArrendadorModalProps
 * @description Propiedades para el componente HistorialPagosArrendadorModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 */
interface HistorialPagosArrendadorModalProps {
    isOpen: boolean
    onClose: () => void
}

/**
 * @component HistorialPagosArrendadorModal
 * @description Un modal que permite a los usuarios seleccionar un arrendador y un rango de fechas
 *              para generar un reporte en PDF del historial de sus pagos.
 * @param {HistorialPagosArrendadorModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal para generar el reporte o `null` si está cerrado.
 */
export default function HistorialPagosArrendadorModal({isOpen, onClose,}: HistorialPagosArrendadorModalProps) {
    const [fechaInicio, setFechaInicio] = useState("")
    const [fechaFin, setFechaFin] = useState("")
    const [arrendadorId, setArrendadorId] = useState<string>("")
    const [arrendadores, setArrendadores] = useState<Option[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [errors, setErrors] = useState<{
        fechaInicio?: string
        fechaFin?: string
        arrendadorId?: string
    }>({})

    /**
     * @effect
     * @description Carga la lista de arrendadores cuando el modal se abre.
     */
    useEffect(() => {
        if (isOpen) {
        const loadArrendadores = async () => {
            try {
            const data = await fetchArrendadores()
            const options = data.map((arrendador) => ({
                value: arrendador.id.toString(),
                label: arrendador.nombre_o_razon_social,
            }))
            setArrendadores(options)
            } catch (error) {
            toast.error("Error al cargar los arrendadores")
            console.error(error)
            }
        }
        loadArrendadores()
        }
    }, [isOpen])

    /**
     * @function handleGenerateReport
     * @description Valida los campos del formulario y, si son correctos,
     *              solicita la generación y descarga del reporte.
     */
    const handleGenerateReport = async () => {
        const newErrors: {
            fechaInicio?: string
            fechaFin?: string
            arrendadorId?: string
        } = {}
        if (!fechaInicio) {
            newErrors.fechaInicio = "Debe seleccionar una fecha de inicio"
        }
        if (!fechaFin) {
            newErrors.fechaFin = "Debe seleccionar una fecha de fin"
        }
        if (!arrendadorId) {
            newErrors.arrendadorId = "Debe seleccionar un arrendador"
        }
        if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
            newErrors.fechaFin = "La fecha de fin no puede ser anterior a la fecha de inicio"
        }
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
            Object.values(newErrors).forEach(error => toast.error(error));
            return
        }
        const arrendadorSeleccionado = arrendadores.find(
            (arr) => arr.value === arrendadorId
        );
        const nombreParaArchivo = arrendadorSeleccionado
            ? arrendadorSeleccionado.label
                .normalize("NFD") // Quita acentos
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_ ]/g, "") // Quita símbolos
                .replace(/\s+/g, "_") // Reemplaza espacios con guion bajo
            : "Arrendador"; // Nombre de respaldo por si algo falla
        const filename = `pagos_${nombreParaArchivo}.pdf`;
        try {
            setIsGenerating(true)
            const blob = await fetchReporteArrendador("/api/reportes/historial-pagos-arrendador/pdf",{inicio: fechaInicio, fin: fechaFin, arrendador_id: parseInt(arrendadorId),})
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = filename
            link.click()
            window.URL.revokeObjectURL(url)
            toast.success("Reporte generado con éxito")
            resetForm()
            onClose()
        } catch (error) {
            toast.error("Error al generar el reporte")
            console.error(error)
        } finally {
            setIsGenerating(false)
        }
    }

    /**
     * @function resetForm
     * @description Resetea el estado del formulario.
     */
    const resetForm = () => {
        setFechaInicio("")
        setFechaFin("")
        setArrendadorId("")
        setErrors({})
    }

    /**
     * @function handleClose
     * @description Cierra el modal.
     */
    const handleClose = () => {
        if (isGenerating) return;
        resetForm();
        onClose();
    };
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Parámetros del Reporte
                    </h3>
                    <button
                        onClick={handleClose}
                        className={`text-gray-400 hover:text-gray-600 transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isGenerating}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <DateInput
                        label="Fecha de Inicio"
                        value={fechaInicio}
                        onChange={setFechaInicio}
                        error={errors.fechaInicio}
                    />
                    <DateInput
                        label="Fecha de Fin"
                        value={fechaFin}
                        onChange={setFechaFin}
                        error={errors.fechaFin}
                    />
                    <ArrendadorSelect
                        label="Arrendador"
                        arrendadores={arrendadores}
                        onSelect={setArrendadorId}
                        value={arrendadorId}
                    />
                    {errors.arrendadorId && <p className="mt-1 text-xs font-medium text-red-600">{errors.arrendadorId}</p>}
                </div>
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        className={`btn-secondary px-4 py-2 rounded-md transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isGenerating}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isGenerating}
                    >
                        <FileDown className="h-5 w-5" />
                        <span>{isGenerating ? "Generando..." : "Generar Reporte"}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
