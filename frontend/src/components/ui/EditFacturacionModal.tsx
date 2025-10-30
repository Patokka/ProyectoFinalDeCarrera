'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import DateInput from "./DateInput";
import { FacturacionDtoOut } from "@/lib/type";
import { putFacturacion } from "@/lib/facturaciones/auth";

interface EditFacturacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    factura: FacturacionDtoOut | null;
}

const EditFacturacionModal: React.FC<EditFacturacionModalProps> = ({ isOpen, onClose, onSuccess, factura }) => {
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (factura) {
            setFecha(factura.fecha_facturacion);
        }
    }, [factura]);

    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!fecha) newErrors.fecha = "La fecha de facturación es obligatoria";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGuardar = async () => {
        if (!validateForm() || !factura) return;

        try {
            setIsSubmitting(true);
            await putFacturacion(factura.id, fecha);
            toast.success("Factura actualizada con éxito");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            const msg = error.message || "Error al actualizar la factura";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !factura) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold text-center text-gray-900">
                        Editar Factura
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
                        label="Fecha de Facturación"
                        value={fecha}
                        onChange={setFecha}
                        placeholder="Seleccionar fecha"
                        error={errors.fecha}
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

export default EditFacturacionModal;