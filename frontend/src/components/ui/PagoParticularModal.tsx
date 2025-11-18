'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Download, X } from "lucide-react";
import { fetchArrendamientosActivos, fetchParticipacionesByArrendamiento } from "@/lib/arrendamientos/auth";
import { ArrendamientoDtoOut, PagoForm, ParticipacionArrendadorDtoOut, TipoDiasPromedio, TipoOrigenPrecio } from "@/lib/type";
import SelectFilter from "./SelectFilter";
import DateInput from "./DateInput";
import { NumberInput } from "./NumberInput";
import { postPago } from "@/lib/pagos/auth";

/**
 * @interface PagoModalProps
 * @description Propiedades para el componente PagoParticularModal.
 */
interface PagoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * @component PagoParticularModal
 * @description Modal para la creación de un pago "particular" o manual,
 *              sea de tipo fijo (quintales) or a porcentaje.
 * @param {PagoModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal o `null` si está cerrado.
 */
const PagoParticularModal: React.FC<PagoModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Estados del formulario y UI...
    const [arrendamientos, setArrendamientos] = useState<ArrendamientoDtoOut[]>([]);
    const [participaciones, setParticipaciones] = useState<ParticipacionArrendadorDtoOut[]>([]);
    const [arrendamientoSeleccionado, setArrendamientoSeleccionado] = useState<number | null>(null);
    const [participacionSeleccionada, setParticipacionSeleccionada] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<PagoForm>>({});
    const [tipoPago, setTipoPago] = useState<string>("PORCENTAJE");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea todos los estados.
     */
    const handleClose = () => {
        // Reset de todos los estados...
        onClose();
    };

    /**
     * @effect
     * @description Carga los arrendamientos activos cuando se abre el modal.
     */
    useEffect(() => {
        if (isOpen) {
            fetchArrendamientosActivos()
                .then(setArrendamientos)
                .catch(() => toast.error("Error al cargar arrendamientos."));
        }
    }, [isOpen]);

    /**
     * @effect
     * @description Carga las participaciones cuando se selecciona un arrendamiento.
     */
    useEffect(() => {
        if (arrendamientoSeleccionado) {
            fetchParticipacionesByArrendamiento(arrendamientoSeleccionado)
                .then(setParticipaciones)
                .catch(() => toast.error("Error al cargar arrendadores."));
        } else {
            setParticipaciones([]);
        }
        setParticipacionSeleccionada(null);
    }, [arrendamientoSeleccionado]);

    /**
     * @function validateForm
     * @description Valida el formulario antes del envío.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        // Lógica de validación...
        return true;
    };

    /**
     * @function handleGuardar
     * @description Valida y envía los datos para crear el nuevo pago.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;

        const nuevoPago: PagoForm = {
            arrendamiento_id: arrendamientoSeleccionado!,
            participacion_arrendador_id: participacionSeleccionada!,
            vencimiento: formData.vencimiento!,
            fuente_precio: formData.fuente_precio!,
            quintales: tipoPago === "FIJO" ? formData.quintales : null,
            dias_promedio: tipoPago === "FIJO" ? formData.dias_promedio : null,
            porcentaje: tipoPago === "PORCENTAJE" ? formData.porcentaje : null,
        };

        try {
            setIsSubmitting(true);
            await postPago(nuevoPago);
            toast.success("Pago creado correctamente.");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            toast.error("Error al crear el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* ... (resto del JSX) ... */}
            </div>
        </div>
    );
};

export default PagoParticularModal;
