'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Download, X } from "lucide-react";
import DateInput from "./DateInput";
import { RetencionDtoOut } from "@/lib/type";
import { putRetencion } from "@/lib/retenciones/auth";
import { NumberInput } from "./NumberInput";

/**
 * @interface EditRetencionModalProps
 * @description Propiedades para el componente EditRetencionModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional tras una edición exitosa.
 * @property {RetencionDtoOut | null} retencion - El objeto de la retención a editar.
 */
interface EditRetencionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    retencion: RetencionDtoOut | null;
}

/**
 * @component EditRetencionModal
 * @description Un modal con un formulario para editar la fecha y el total de una retención existente.
 * @param {EditRetencionModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de edición o `null` si está cerrado.
 */
const EditRetencionModal: React.FC<EditRetencionModalProps> = ({ isOpen, onClose, onSuccess, retencion }) => {
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalRetencion, setTotalRetencion] = useState<number | undefined>(undefined);

    /**
     * @effect
     * @description Carga los datos de la retención en el formulario cuando el modal se abre.
     */
    useEffect(() => {
        if (retencion) {
            setFecha(retencion.fecha_retencion);
            setTotalRetencion(retencion.total_retencion);
        }
    }, [retencion]);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado.
     */
    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    /**
     * @function validateForm
     * @description Valida los campos del formulario.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!fecha) newErrors.fecha = "La fecha de retención es obligatoria";
        if (totalRetencion === undefined || totalRetencion <= 0) {
            newErrors.totalRetencion = "El total de la retención debe ser un número positivo";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleGuardar
     * @description Valida y guarda los cambios de la retención.
     */
    const handleGuardar = async () => {
        if (!validateForm() || !retencion) return;

        try {
            setIsSubmitting(true);
            await putRetencion(retencion.id, fecha, totalRetencion);
            toast.success("Retención actualizada con éxito");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            const msg = error.message || "Error al actualizar la retención";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !retencion) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold text-center text-gray-900">
                        Editar Retención
                    </h3>
                    <button
                        onClick={handleClose}
                        className={`text-gray-400 ml-4 hover:text-gray-600 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <DateInput
                        label="Fecha de Retención"
                        value={fecha}
                        onChange={setFecha}
                        placeholder="Seleccionar fecha"
                        error={errors.fecha}
                    />
                    <NumberInput
                        label="Total Retención"
                        value={totalRetencion ?? 0}
                        min={0}
                        onChange={(val) => setTotalRetencion(Number(val))}
                        placeholder="Ingrese el total de la retención"
                        error={errors.totalRetencion}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        className={`btn-secondary px-4 py-2 rounded-md transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={isSubmitting}
                        className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Download className='h-4 w-4' />
                        <span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRetencionModal;