'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import DateInput from "./DateInput";
import { FacturacionDtoOut } from "@/lib/type";
import { putFacturacion } from "@/lib/facturaciones/auth";
import { NumberInput } from "./NumberInput";

/**
 * @interface EditFacturacionModalProps
 * @description Propiedades para el componente EditFacturacionModal.
 * @property {boolean} isOpen - Indica si el modal está abierto.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional para después de una edición exitosa.
 * @property {FacturacionDtoOut | null} factura - El objeto de la factura a editar.
 */
interface EditFacturacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    factura: FacturacionDtoOut | null;
}

/**
 * @component EditFacturacionModal
 * @description Un modal con un formulario para editar la fecha y el monto de una facturación existente.
 * @param {EditFacturacionModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de edición o `null` si está cerrado.
 */
const EditFacturacionModal: React.FC<EditFacturacionModalProps> = ({ isOpen, onClose, onSuccess, factura }) => {
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [montoFacturacion, setMontoFacturacion] = useState<number | undefined>(undefined);
    
    /**
     * @effect
     * @description Carga los datos de la factura seleccionada en el formulario cuando el modal se abre.
     */
    useEffect(() => {
        if (factura) {
            setFecha(factura.fecha_facturacion);
            setMontoFacturacion(factura.monto_facturacion);
        }
    }, [factura]);

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
        if (!fecha) newErrors.fecha = "La fecha es obligatoria";
        if (montoFacturacion === undefined || montoFacturacion <= 0) {
            newErrors.montoFacturacion = "El monto debe ser un número positivo";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleGuardar
     * @description Valida y guarda los cambios de la facturación.
     */
    const handleGuardar = async () => {
        if (!validateForm() || !factura) return;
        try {
            setIsSubmitting(true);
            await putFacturacion(factura.id, fecha, montoFacturacion);
            toast.success("Factura actualizada con éxito");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar la factura");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !factura) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold">Editar Factura</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <DateInput label="Fecha de Facturación" value={fecha} onChange={setFecha} error={errors.fecha} />
                    <NumberInput label="Monto de Facturación" value={montoFacturacion} min={0} onChange={val => setMontoFacturacion(val)} error={errors.montoFacturacion} />
                </div>
                
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSubmitting} className="btn-primary">
                        <Download size={16} /><span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditFacturacionModal;
