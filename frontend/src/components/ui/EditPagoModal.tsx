'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import { NumberInput } from "./NumberInput";
import DateInput from "./DateInput";
import { PagoDtoOut, PagoForm } from "@/lib/type";
import { putPago } from "@/lib/pagos/auth";

/**
 * @interface EditPagoModalProps
 * @description Propiedades para el componente EditPagoModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional tras una edición exitosa.
 * @property {PagoDtoOut | null} pago - El objeto del pago a editar.
 */
interface EditPagoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    pago: PagoDtoOut | null;
}

/**
 * @component EditPagoModal
 * @description Un modal con un formulario para editar los detalles de un pago existente.
 *              Permite modificar la fecha, quintales, porcentaje, monto y precio promedio.
 * @param {EditPagoModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de edición o `null` si está cerrado.
 */
const EditPagoModal: React.FC<EditPagoModalProps> = ({ isOpen, onClose, onSuccess, pago }) => {
    const [formData, setFormData] = useState<Partial<PagoForm>>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @effect
     * @description Carga los datos del pago seleccionado en el estado del formulario cuando se abre el modal.
     */
    useEffect(() => {
        if (pago) {
            setFormData({
                vencimiento: pago.vencimiento,
                quintales: pago.quintales,
                porcentaje: pago.porcentaje,
                monto_a_pagar: pago.monto_a_pagar,
                precio_promedio: pago.precio_promedio,
            });
        }
    }, [pago, isOpen]);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea todos los estados.
     */
    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        setFormData({});
        onClose();
    };

    /**
     * @function validateForm
     * @description Valida los campos del formulario antes del envío.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.vencimiento) newErrors.vencimiento = "La fecha es obligatoria";
        // Lógica de validación para quintales vs porcentaje...
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleGuardar
     * @description Valida y envía los datos actualizados del pago a la API.
     */
    const handleGuardar = async () => {
        if (!validateForm() || !pago) return;
        if (["REALIZADO", "CANCELADO"].includes(pago.estado)) {
            return toast.error("No se puede editar un pago realizado o cancelado.");
        }

        try {
            setIsSubmitting(true);
            const payload: PagoForm = {
                ...formData,
                vencimiento: formData.vencimiento!,
                arrendamiento_id: pago.arrendamiento.id,
                participacion_arrendador_id: pago.participacion_arrendador.id,
                fuente_precio: pago.fuente_precio!,
                dias_promedio: pago.dias_promedio,
            };
            await putPago(pago.id, payload);
            toast.success("Pago actualizado con éxito.");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !pago) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold">Editar Pago</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <DateInput label="Fecha de Vencimiento" value={formData.vencimiento || ''} onChange={v => setFormData(p => ({...p, vencimiento: v}))} error={errors.vencimiento} />
                    {pago.porcentaje != null ? (
                        <NumberInput label="Porcentaje a Pagar (%)" value={formData.porcentaje} min={0} max={100} onChange={v => setFormData(p => ({...p, porcentaje: v}))} error={errors.porcentaje} />
                    ) : (
                        <>
                            <NumberInput label="Quintales a Pagar" value={formData.quintales} min={0} onChange={v => setFormData(p => ({...p, quintales: v}))} error={errors.quintales} />
                            <NumberInput label="Precio Promedio por Quintal" value={formData.precio_promedio} min={0} onChange={v => setFormData(p => ({...p, precio_promedio: v}))} error={errors.precioPromedioQuintal} />
                            <NumberInput label="Monto a Pagar" value={formData.monto_a_pagar} min={0} onChange={v => setFormData(p => ({...p, monto_a_pagar: v}))} error={errors.montoAPagar} />
                        </>
                    )}
                </div>
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSubmitting} className="btn-primary">
                        <Download size={16}/><span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPagoModal;
