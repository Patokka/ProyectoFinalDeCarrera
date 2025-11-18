'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, X } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { fetchConfiguracion, actualizarConfiguracion } from "@/lib/configuracion/auth";

/**
 * @interface MinimoImponibleModalProps
 * @description Propiedades para el componente MinimoImponibleModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional tras una actualización exitosa.
 */
interface MinimoImponibleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CLAVE_MONTO = "MINIMO_IMPONIBLE";

/**
 * @component MinimoImponibleModal
 * @description Un modal para ver y actualizar el valor del mínimo no imponible para las retenciones.
 * @param {MinimoImponibleModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal o `null` si está cerrado.
 */
const MinimoImponibleModal: React.FC<MinimoImponibleModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [monto, setMonto] = useState<number | undefined>(undefined);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @effect
     * @description Carga el valor actual del mínimo imponible desde la API cuando se abre el modal.
     */
    useEffect(() => {
        if (isOpen) {
            fetchConfiguracion(CLAVE_MONTO)
                .then(res => setMonto(res ? Number(res) : undefined))
                .catch(() => toast.error("No se pudo obtener el valor actual."));
        }
    }, [isOpen]);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado.
     */
    const handleClose = () => {
        setMonto(undefined);
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    /**
     * @function validateForm
     * @description Valida que el monto ingresado sea un número válido y positivo.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (monto === undefined || monto < 0) {
            newErrors.monto = "Debe ingresar un monto válido y positivo.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleGuardar
     * @description Valida el formulario y envía el nuevo valor del mínimo imponible a la API.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            const valorString = monto!.toFixed(2).replace(',', '.');
            await actualizarConfiguracion(CLAVE_MONTO, valorString);
            toast.success("Mínimo imponible actualizado.");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold">Configurar Mínimo Imponible</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <NumberInput
                        label="Monto Imponible"
                        value={monto}
                        min={0}
                        step={0.01}
                        onChange={val => setMonto(val)}
                        error={errors.monto}
                    />
                </div>

                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSubmitting} className="btn-primary">
                        <RotateCcw size={16}/>
                        <span>{isSubmitting ? "Guardando..." : "Guardar Monto"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MinimoImponibleModal;
