'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, X } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { fetchConfiguracion, actualizarConfiguracion } from "@/lib/configuracion/auth";

interface MontoImponibleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CLAVE_MONTO = "MONTO_IMPONIBLE";

const MontoImponibleModal: React.FC<MontoImponibleModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [monto, setMonto] = useState<number | undefined>(undefined);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar valor actual de la configuración al abrir el modal
    useEffect(() => {
        if (isOpen) {
            fetchConfiguracion(CLAVE_MONTO)
                .then((res) => {
                    setMonto(Number(res));
                })
                .catch(() => {
                    toast.error("No se pudo obtener el monto imponible actual");
                    setMonto(undefined);
                });
        }
    }, [isOpen]);

    const handleClose = () => {
        setMonto(undefined);
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (monto === undefined || monto < 0) {
            newErrors.monto = "Debe ingresar un monto válido";
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos correctamente");
            return false;
        }
        return true;
    };

    const handleGuardar = async () => {
    if (!validateForm()) return;

    try {
        setIsSubmitting(true);
        // convertir number a string con coma decimal y 2 decimales
        const valorString = monto !== null && monto !== undefined
        ? monto.toFixed(2).replace(',', '.')
        : '0.00';

        await actualizarConfiguracion("MONTO_IMPONIBLE", valorString);
        toast.success("Monto imponible actualizado correctamente");
        handleClose();
    } catch (error: any) {
        const msg = error.message || "Error al actualizar el monto imponible";
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
                        Configurar Monto Imponible
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
                        label="Monto Imponible"
                        value={monto ?? 0}
                        min={0}
                        step={0.01}
                        onChange={(val) => setMonto(Math.floor(Number(val) * 100) / 100)}
                        placeholder="Ingrese el monto imponible"
                        error={errors.monto}
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
                        <RotateCcw className='h-4 w-4'/>
                        <span>{isSubmitting ? "Guardando..." : "Guardar Monto"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MontoImponibleModal;
