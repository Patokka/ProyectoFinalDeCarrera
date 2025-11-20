'use client';

import React, { useState } from "react";
import { toast } from "sonner";
import { Download, X } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { facturarPago } from "@/lib/pagos/auth";

/**
 * @interface FacturacionModalProps
 * @description Propiedades para el componente FacturacionModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional tras una creación exitosa.
 */
interface FacturacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * @component FacturacionModal
 * @description Un modal para crear una nueva facturación a partir de un número de pago.
 * @param {FacturacionModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de facturación o `null` si está cerrado.
 */
const FacturacionModal: React.FC<FacturacionModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [numero_pago, setNumeroPago] = useState<number>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado.
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
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!numero_pago) newErrors.numero_pago = "Campo obligatorio";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos obligatorios");
            return false;
        }
        return true;
    };

    /**
     * @function handleGuardar
     * @description Valida el formulario y envía la solicitud para crear la facturación.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            await facturarPago(Number(numero_pago));
            toast.success("Facturación creada con éxito, volviendo a página de facturaciones...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            setNumeroPago(undefined);
            setErrors({});
            setIsSubmitting(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            const msg =  error.message || "Error al crear la facturación"
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold text-center text-gray-900">
                        Crear Facturación
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
                    <NumberInput
                        label="Número de pago"
                        value={numero_pago ?? 0}
                        min={0}
                        step={1}
                        onChange={(val) => setNumeroPago(Math.floor(Number(val)))}
                        placeholder="Ingrese el número de pago"
                        error={errors.numero_pago}
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
                        <Download className='h-4 w-4'/>
                        <span>{isSubmitting ? "Guardando..." : "Guardar Facturación"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacturacionModal;
