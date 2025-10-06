'use client';

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { fetchArrendamientosActivos, fetchParticipacionesByArrendamiento } from "@/lib/arrendamientos/auth";
import { ArrendamientoDtoOut, PagoForm, ParticipacionArrendadorDtoOut, TipoOrigenPrecio } from "@/lib/type";
import SelectFilter from "./SelectFilter";
import DateInput from "./DateInput";
import { NumberInput } from "./NumberInput";

interface PagoParticularModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (data: {
        arrendamientoId: number;
        participacionId: number;
        fecha: string;
        quintales: number;
        fuentePrecio: string;
        promedio: string;
    }) => void;
    onSuccess?: () => void;
}

const PagoParticularModal: React.FC<PagoParticularModalProps> = ({isOpen, onClose, onGuardar,}) => {
    const [arrendamientos, setArrendamientos] = useState<ArrendamientoDtoOut[]>([]);
    const [participaciones, setParticipaciones] = useState<ParticipacionArrendadorDtoOut[]>([]);
    const [arrendamientoSeleccionado, setArrendamientoSeleccionado] = useState<number | null>(null);
    const [participacionSeleccionada, setParticipacionSeleccionada] = useState<number | null>(null);
    const [fecha, setFecha] = useState("");
    const [quintales, setQuintales] = useState<number | null>(null);
    const [fuentePrecio, setFuentePrecio] = useState("");
    const [promedio, setPromedio] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [loadingArr, setLoadingArr] = useState(false);
    const [loadingPart, setLoadingPart] = useState(false);

    const ORIGENES = [
        { value: "BCR", label: "Bolsa de Comercio (BCR)" },
        { value: "AGD", label: "Aceitera General Deheza (AGD)" },
    ];

    const promedioOptions = [
        { value: "ULTIMOS_5_HABILES", label: "Últimos 5 días hábiles del mes anterior al pago" },
        { value: "ULTIMOS_10_HABILES", label: "Últimos 10 días hábiles del mes anterior al pago" },
        { value: "ULTIMO_MES", label: "Mes anterior al pago" },
        { value: "DEL_10_AL_15_MES_ACTUAL", label: "Precios del día 10 al día 15 del mes actual al pago" },
    ];

    // 🟢 Cargar arrendamientos al abrir el modal
    useEffect(() => {
        if (isOpen) {
            setLoadingArr(true);
            fetchArrendamientosActivos()
                .then((data) => setArrendamientos(data))
                .catch((err) => console.error("Error al obtener arrendamientos:", err))
                .finally(() => setLoadingArr(false));
        }
    }, [isOpen]);

    // 🟣 Cargar participaciones al seleccionar arrendamiento
    useEffect(() => {
        if (arrendamientoSeleccionado) {
            setLoadingPart(true);
            fetchParticipacionesByArrendamiento(arrendamientoSeleccionado)
                .then((data) => setParticipaciones(data))
                .catch((err) => console.error("Error al obtener participaciones:", err))
                .finally(() => setLoadingPart(false));
        } else {
            setParticipaciones([]);
        }
    }, [arrendamientoSeleccionado]);

    //Validación de formulario
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        const hoy = new Date();
        const fechaSeleccionada = new Date(fecha);

        if (!arrendamientoSeleccionado) newErrors.arrendamiento = "Campo obligatorio";
        if (!participacionSeleccionada) newErrors.participacion = "Campo obligatorio";
        if (!fecha) {
            newErrors.fecha = "Campo obligatorio";
        } else if (fechaSeleccionada <= hoy) {
            newErrors.fecha = "Debe seleccionar una fecha posterior a hoy";
        }
        if (!fuentePrecio) newErrors.fuentePrecio = "Campo obligatorio";
        if (!promedio) newErrors.promedio = "Campo obligatorio";
        if (!quintales) newErrors.quintales = "Campo obligatorio";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos obligatorios");
            return false;
        }

        return true;
    };

    const handleGuardar = async () => {
        if (!validateForm()) return;

        const nuevoPago: PagoForm = {
            arrendamiento_id: arrendamientoSeleccionado!,
            participacion_arrendador_id: participacionSeleccionada!,
            vencimiento: fecha,
            quintales: quintales!,
            fuente_precio: fuentePrecio as TipoOrigenPrecio,
            precio_promedio: promedio,
        };

        try {
            setIsSubmitting(true);
            await postPago(nuevoPago);
            toast.success("Pago particular creado correctamente, volviendo a la página de pagos...");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al crear el pago particular");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isOpen) return null;

    // Calcular fecha mínima = mañana
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Agregar Pago Particular
                    </h2>
                    <button
                        onClick={onClose}
                        className={`text-gray-400 hover:text-gray-600 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Arrendamiento */}
                    {loadingArr ? (
                        <p className="text-gray-500 text-sm">Cargando arrendamientos...</p>
                    ) : (
                        <SelectFilter
                            label="Arrendamiento"
                            value={arrendamientoSeleccionado ?? ""}
                            onChange={(value) => setArrendamientoSeleccionado(Number(value))}
                            options={arrendamientos.map((a) => ({
                                value: a.id.toString(),
                                label: `Arrendamiento Nº ${a.id}`,
                            }))}
                            placeholder="Seleccionar..."
                            error={errors.arrendamiento}
                        />
                    )}

                    {/* Participación */}
                    {loadingPart ? (
                        <p className="text-gray-500 text-sm">Cargando participaciones...</p>
                    ) : (
                        <SelectFilter
                            label="Arrendador de Participación"
                            value={participacionSeleccionada ?? ""}
                            onChange={(value) => setParticipacionSeleccionada(Number(value))}
                            options={participaciones.map((p) => ({
                                value: p.id.toString(),
                                label: p.arrendador.nombre_o_razon_social,
                            }))}
                            placeholder="Seleccionar..."
                            error={errors.participacion}
                        />
                    )}

                    {/* Fecha */}
                    <DateInput
                        label="Fecha del Pago"
                        value={fecha}
                        onChange={setFecha}
                        error={errors.fecha}
                    />

                    {/* Fuente */}
                    <SelectFilter
                        label="Fuente del Precio"
                        value={fuentePrecio}
                        onChange={setFuentePrecio}
                        options={ORIGENES}
                        placeholder="Seleccionar fuente"
                        error={errors.fuentePrecio}
                    />

                    {/* Promedio */}
                    <SelectFilter
                        label="Promedio de precios"
                        value={promedio}
                        onChange={setPromedio}
                        options={promedioOptions}
                        placeholder="Seleccionar periodo de promedio"
                        error={errors.promedio}
                    />

                    {/* Quintales */}
                    <NumberInput
                        label="Quintales"
                        value={quintales ?? 0}
                        min={0}
                        onChange={(val) => setQuintales(Number(val))}
                        placeholder="Ingrese cantidad de quintales"
                        error={errors.quintales}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={isSubmitting}
                        className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-2 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar Pago"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PagoParticularModal;
