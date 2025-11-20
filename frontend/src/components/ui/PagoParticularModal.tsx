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
const PagoModal: React.FC<PagoModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [arrendamientos, setArrendamientos] = useState<ArrendamientoDtoOut[]>([]);
    const [participaciones, setParticipaciones] = useState<ParticipacionArrendadorDtoOut[]>([]);
    const [arrendamientoSeleccionado, setArrendamientoSeleccionado] = useState<number | null>(null);
    const [participacionSeleccionada, setParticipacionSeleccionada] = useState<number | null>(null);
    const [fecha, setFecha] = useState("");
    const [quintales, setQuintales] = useState<number | null>(null);
    const [fuentePrecio, setFuentePrecio] = useState("");
    const [promedio, setPromedio] = useState("");
    const [porcentaje, setPorcentaje] = useState<number | null>(null);
    const [tipoPago, setTipoPago] = useState<string>("PORCENTAJE");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingArr, setLoadingArr] = useState(false);
    const [loadingPart, setLoadingPart] = useState(false);

    // opciones fijas
    const TIPOS_PAGO = [
        { value: "PORCENTAJE", label: "Pago de porcentaje de producción" },
        { value: "FIJO", label: "Pago fijo de quintales" },
    ];

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

    /**
     * @function handleClose
     * @description Cierra el modal y resetea todos los estados.
     */
    const handleClose = () => {
        // Reset de todos los campos del formulario
        setArrendamientoSeleccionado(null);
        setParticipacionSeleccionada(null);
        setFecha("");
        setQuintales(null);
        setFuentePrecio("");
        setPromedio("");
        setPorcentaje(null);
        setTipoPago("PORCENTAJE");
        // Reset de errores y flags
        setErrors({});
        setIsSubmitting(false);
        setLoadingArr(false);
        setLoadingPart(false);
        // Limpieza de listas dependientes
        setParticipaciones([]);
        // No se limpian arrendamientos porque se recargan automáticamente al abrir
        onClose();
    };

    /**
     * @effect
     * @description Carga los arrendamientos activos cuando se abre el modal.
     */
    useEffect(() => {
        if (isOpen) {
        setLoadingArr(true);
        fetchArrendamientosActivos()
            .then((data) => setArrendamientos(data))
            .catch((err) => console.error("Error al obtener arrendamientos:", err))
            .finally(() => setLoadingArr(false));
        }
    }, [isOpen]);

    /**
     * @effect
     * @description Carga las participaciones cuando se selecciona un arrendamiento.
     */
    useEffect(() => {
        if (arrendamientoSeleccionado) {
        setLoadingPart(true);
        setParticipacionSeleccionada(null);
        fetchParticipacionesByArrendamiento(arrendamientoSeleccionado)
            .then((data) => setParticipaciones(data))
            .catch((err) => console.error("Error al obtener participaciones:", err))
            .finally(() => setLoadingPart(false));
        } else {
        setParticipaciones([]);
        }
    }, [arrendamientoSeleccionado]);

    /**
     * @function validateForm
     * @description Valida el formulario antes del envío.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!arrendamientoSeleccionado) newErrors.arrendamiento = "Campo obligatorio";
        if (!participacionSeleccionada) newErrors.participacion = "Campo obligatorio";
        if (!fecha) {
            newErrors.fecha = "Campo obligatorio";
        }
        if (!fuentePrecio) newErrors.fuentePrecio = "Campo obligatorio";
        if (!promedio) newErrors.promedio = "Campo obligatorio";
        if (!quintales) newErrors.quintales = "Campo obligatorio";
        if (tipoPago === "PORCENTAJE" && (porcentaje === null || porcentaje <= 0)) {
            newErrors.porcentaje = "Debe ingresar un porcentaje válido";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos obligatorios");
            return false;
        }
        return true;
    };

    /**
     * @function handleGuardar
     * @description Valida y envía los datos para crear el nuevo pago.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;

        // Payload base
        const nuevoPago: PagoForm = {
            arrendamiento_id: arrendamientoSeleccionado!,
            participacion_arrendador_id: participacionSeleccionada!,
            vencimiento: fecha,
            fuente_precio: fuentePrecio as TipoOrigenPrecio,
            quintales: null,
            dias_promedio: null,
            porcentaje: null,
        };

        // Variación según tipo de pago
        if (tipoPago === "FIJO") {
            nuevoPago.quintales = quintales!;
            nuevoPago.dias_promedio = promedio as TipoDiasPromedio;
            nuevoPago.porcentaje = null;
        } else if (tipoPago === "PORCENTAJE") {
            nuevoPago.porcentaje = porcentaje!;
            nuevoPago.quintales = null;
            nuevoPago.dias_promedio = null;
        }

        try {
            setIsSubmitting(true);
            await postPago(nuevoPago);
            toast.success("Pago creado correctamente, volviendo a página de pagos...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error("Error al crear el pago particular");
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
                        Crear Pago
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
                    {/* Tipo de Pago */}
                    <SelectFilter
                        label="Tipo de Pago"
                        value={tipoPago}
                        onChange={setTipoPago}
                        options={TIPOS_PAGO}
                        placeholder="Seleccionar tipo"
                    />
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
                        label="Arrendador"
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
                        label="Fecha de vencimiento"
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
                    {tipoPago === "FIJO" && (
                    <SelectFilter
                        label="Promedio de precios"
                        value={promedio}
                        onChange={setPromedio}
                        options={promedioOptions}
                        placeholder="Seleccionar periodo de promedio"
                        error={errors.promedio}
                    />
                    )}
                    {/* Quintales */}
                    {tipoPago === "FIJO" && (
                    <NumberInput
                        label="Quintales a pagar"
                        value={quintales ?? 0}
                        min={0}
                        onChange={(val) => setQuintales(Number(val))}
                        placeholder="Ingrese cantidad de quintales"
                        error={errors.quintales}
                    />
                    )}
                    {/* Porcentaje solo si es pago particular */}
                    {tipoPago === "PORCENTAJE" && (
                        <NumberInput
                        label="Porcentaje de producción a entregar"
                        value={porcentaje ?? 0}
                        min={0}
                        max={100}
                        onChange={(val) => setPorcentaje(Number(val))}
                        placeholder="Ingrese porcentaje del pago"
                        error={errors.porcentaje}
                        />
                    )}
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
                        <span>{isSubmitting ? "Guardando..." : "Guardar Pago"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PagoModal;
