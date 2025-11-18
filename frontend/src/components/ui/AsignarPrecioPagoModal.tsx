'use client';

import React, { useState } from "react";
import { toast } from "sonner";
import { Calculator, X } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { asignarPrecioPago } from "@/lib/pagos/auth";

/**
 * @interface AsignarPrecioModalProps
 * @description Propiedades para el componente AsignarPrecioModal.
 * @property {boolean} isOpen - Indica si el modal está abierto.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Función opcional a ejecutar tras una operación exitosa.
 */
interface AsignarPrecioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * @component AsignarPrecioModal
 * @description Un modal que permite al usuario ingresar un número de pago para
 *              solicitar a la API que calcule y asigne su precio promedio.
 * @param {AsignarPrecioModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal o `null` si no está abierto.
 */
const AsignarPrecioModal: React.FC<AsignarPrecioModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [numero_pago, setNumeroPago] = useState<number>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado interno.
     */
    const handleClose = () => {
        setNumeroPago(undefined);
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    /**
     * @function validateForm
     * @description Valida que se haya ingresado un número de pago.
     * @returns {boolean} `true` si es válido, `false` en caso contrario.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!numero_pago) newErrors.numero_pago = "Campo obligatorio";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos.");
            return false;
        }
        return true;
    };

    /**
     * @function handleGuardar
     * @description Valida el formulario y llama a la API para asignar el precio al pago.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            await asignarPrecioPago(Number(numero_pago));
            toast.success("Precio asignado correctamente.");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || "Error al asignar el precio.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold">Asignar Precio a Pago</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <NumberInput
                        label="Número de pago"
                        value={numero_pago || 0}
                        min={0}
                        onChange={(val) => setNumeroPago(val ? Math.floor(val) : undefined)}
                        placeholder="Ingrese el número de pago"
                        error={errors.numero_pago}
                    />
                </div>

                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSubmitting} className="btn-primary">
                        <Calculator size={16}/><span>{isSubmitting ? "Calculando..." : "Calcular Precio"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AsignarPrecioModal;
