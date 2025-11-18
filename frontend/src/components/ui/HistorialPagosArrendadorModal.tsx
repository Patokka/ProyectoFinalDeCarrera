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
    const [errors, setErrors] = useState<{ fechaInicio?: string; fechaFin?: string; arrendadorId?: string }>({})

    /**
     * @effect
     * @description Carga la lista de arrendadores cuando el modal se abre.
     */
    useEffect(() => {
        if (isOpen) {
            const loadArrendadores = async () => {
                try {
                    const data = await fetchArrendadores()
                    setArrendadores(data.map(a => ({ value: String(a.id), label: a.nombre_o_razon_social })));
                } catch (error) {
                    toast.error("Error al cargar los arrendadores")
                }
            }
            loadArrendadores()
        }
    }, [isOpen])

    /**
     * @function validateAndGenerate
     * @description Valida los campos del formulario y, si son correctos,
     *              solicita la generación y descarga del reporte.
     */
    const validateAndGenerate = async () => {
        const newErrors: { fechaInicio?: string; fechaFin?: string; arrendadorId?: string } = {}
        if (!fechaInicio) newErrors.fechaInicio = "Seleccione una fecha de inicio";
        if (!fechaFin) newErrors.fechaFin = "Seleccione una fecha de fin";
        if (!arrendadorId) newErrors.arrendadorId = "Seleccione un arrendador";
        if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
            newErrors.fechaFin = "La fecha de fin no puede ser anterior a la de inicio";
        }
        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) {
            Object.values(newErrors).forEach(error => toast.error(error));
            return
        }

        const arrendador = arrendadores.find(a => a.value === arrendadorId);
        const filename = `pagos_${arrendador?.label.replace(/\s+/g, "_") || 'arrendador'}.pdf`;

        try {
            setIsGenerating(true)
            const blob = await fetchReporteArrendador("/api/reportes/historial-pagos-arrendador/pdf", { inicio: fechaInicio, fin: fechaFin, arrendador_id: parseInt(arrendadorId) });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success("Reporte generado con éxito");
            resetFormAndClose();
        } catch (error) {
            toast.error("Error al generar el reporte");
        } finally {
            setIsGenerating(false)
        }
    }

    /**
     * @function resetFormAndClose
     * @description Resetea el estado del formulario y cierra el modal.
     */
    const resetFormAndClose = () => {
        if (isGenerating) return;
        setFechaInicio("")
        setFechaFin("")
        setArrendadorId("")
        setErrors({})
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">Reporte de Pagos por Arrendador</h3>
                    <button onClick={resetFormAndClose} disabled={isGenerating} className="btn-icon-gray">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <DateInput label="Fecha de Inicio" value={fechaInicio} onChange={setFechaInicio} error={errors.fechaInicio} />
                    <DateInput label="Fecha de Fin" value={fechaFin} onChange={setFechaFin} error={errors.fechaFin} />
                    <ArrendadorSelect label="Arrendador" arrendadores={arrendadores} onSelect={setArrendadorId} value={arrendadorId} />
                    {errors.arrendadorId && <p className="error-message">{errors.arrendadorId}</p>}
                </div>
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={resetFormAndClose} disabled={isGenerating} className="btn-secondary">Cancelar</button>
                    <button onClick={validateAndGenerate} disabled={isGenerating} className="btn-primary">
                        <FileDown size={16} /><span>{isGenerating ? "Generando..." : "Generar Reporte"}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
