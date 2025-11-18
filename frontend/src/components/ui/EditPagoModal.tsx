'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import { NumberInput } from "./NumberInput";
import DateInput from "./DateInput";
import { PagoDtoOut, PagoForm } from "@/lib/type";
import { putPago } from "@/lib/pagos/auth";

interface EditPagoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    pago: PagoDtoOut | null;
}

const EditPagoModal: React.FC<EditPagoModalProps> = ({ isOpen, onClose, onSuccess, pago }) => {
    const [vencimiento, setVencimiento] = useState("");
    const [quintales, setQuintales] = useState<number | undefined>(undefined);
    const [porcentaje, setPorcentaje] = useState<number | undefined>(undefined);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [montoAPagar, setMontoAPagar] = useState<number | undefined>(undefined);
    const [precioPromedioQuintal, setPrecioPromedioQuintal] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (pago) {
            setVencimiento(pago.vencimiento);
            // Lógica condicional para quintales o porcentaje
            if (pago.porcentaje !== undefined && pago.porcentaje !== null) {
                setPorcentaje(pago.porcentaje);
                setQuintales(undefined);
                setMontoAPagar(undefined);
                setPrecioPromedioQuintal(undefined);
            } else {
                setQuintales(pago.quintales);
                setMontoAPagar(pago.monto_a_pagar);
                setPorcentaje(undefined);
                setPrecioPromedioQuintal(pago.precio_promedio);
            }
        }
    }, [pago, isOpen]);

    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        setVencimiento("");
        setQuintales(undefined);
        setPorcentaje(undefined);
        setMontoAPagar(undefined);
        setPrecioPromedioQuintal(undefined);
        onClose();
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!vencimiento) newErrors.vencimiento = "La fecha de vencimiento es obligatoria";

        if (pago?.porcentaje !== undefined && pago?.porcentaje !== null) {
            if (porcentaje === undefined || porcentaje <= 0) {
                newErrors.porcentaje = "El porcentaje debe ser un número positivo";
            } else if (porcentaje > 100) {
                newErrors.porcentaje = "El porcentaje no puede ser mayor a 100";
            }
        } else {
            if (quintales === undefined || quintales <= 0) {
                newErrors.quintales = "La cantidad de quintales debe ser un número positivo";
            }
            if (montoAPagar !== undefined && montoAPagar < 0) {
                newErrors.montoAPagar = "El monto no puede ser negativo";
            }
            if (precioPromedioQuintal !== undefined && precioPromedioQuintal < 0) {
                newErrors.precioPromedioQuintal = "El precio promedio no puede ser negativo";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleGuardar = async () => {
        if (!validateForm() || !pago) return;
        if (pago.estado === "REALIZADO" || pago.estado === "CANCELADO") {
            toast.error("No se puede editar un pago que ya ha sido realizado o cancelado.");
            return;
        }
        if (!pago.fuente_precio) {
            toast.error("Error: El pago no tiene 'fuente_precio' y es requerido para la edición.");
            return;
        }

        try {
            setIsSubmitting(true);
            const payloadCompleto: PagoForm = {
                vencimiento: vencimiento,
                arrendamiento_id: pago.arrendamiento.id,
                participacion_arrendador_id: pago.participacion_arrendador.id,
                fuente_precio: pago.fuente_precio,
            };
            if (pago.porcentaje !== undefined && pago.porcentaje !== null) {
                payloadCompleto.porcentaje = porcentaje;
                payloadCompleto.quintales = null;
            } else {
                payloadCompleto.quintales = quintales;
                payloadCompleto.porcentaje = null;
                payloadCompleto.monto_a_pagar = montoAPagar;
                payloadCompleto.precio_promedio = precioPromedioQuintal;
            }
            if (pago.dias_promedio) {
                payloadCompleto.dias_promedio = pago.dias_promedio;
            } else {
                payloadCompleto.dias_promedio = null; 
            }
            await putPago(pago.id, payloadCompleto);
            toast.success("Pago actualizado con éxito");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            const msg = error.message || "Error al actualizar el pago";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !pago) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold text-center text-gray-900">
                        Editar Pago
                    </h3>
                    <button
                        onClick={handleClose}
                        className={`text-gray-400 ml-4 hover:text-gray-600 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <DateInput
                        label="Fecha de Vencimiento"
                        value={vencimiento}
                        onChange={setVencimiento}
                        placeholder="Seleccionar fecha"
                        error={errors.vencimiento}
                    />
                    {(pago.porcentaje !== undefined && pago.porcentaje !== null) ? (
                        // Input de Porcentaje
                        <NumberInput
                            label="Porcentaje a Pagar (%)"
                            value={porcentaje ?? 0}
                            min={0}
                            max={100} // Es buena idea limitar el porcentaje
                            onChange={(val) => setPorcentaje(Number(val))}
                            placeholder="Ingrese el porcentaje"
                            error={errors.porcentaje}
                        />
                    ) : (
                        <>
                            <NumberInput
                                label="Quintales a Pagar"
                                value={quintales ?? 0}
                                min={0}
                                onChange={(val) => setQuintales(Number(val))}
                                placeholder="Ingrese la cantidad de quintales"
                                error={errors.quintales}
                            />
                            <NumberInput
                                label="Precio Promedio por Quintal"
                                value={precioPromedioQuintal ?? 0}
                                min={0}
                                onChange={(val) => setPrecioPromedioQuintal(Number(val))}
                                placeholder="Ingrese el precio promedio"
                                error={errors.precioPromedioQuintal}
                            />
                            <NumberInput
                                label="Monto a Pagar"
                                value={montoAPagar ?? 0}
                                min={0}
                                onChange={(val) => setMontoAPagar(Number(val))}
                                placeholder="Ingrese el monto a pagar"
                                error={errors.montoAPagar}
                            />
                        </>
                    )}
                </div>
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
                        <span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPagoModal;