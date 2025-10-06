'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, X } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import DateInput from '../ui/DateInput';
import SelectFilter from '../ui/SelectFilter';
import { PrecioForm, TipoOrigenPrecio } from '@/lib/type';
import { postPrecio } from '@/lib/precios/auth';

interface PrecioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PrecioModal = ({ isOpen, onClose, onSuccess }: PrecioModalProps) => {
    const [fecha, setFecha] = useState("");
    const [precio, setPrecio] = useState<number | undefined>(undefined);
    const [origen, setOrigen] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const ORIGENES = [
        { value: "BCR", label: "Bolsa de Comercio (BCR)" },
        { value: "AGD", label: "Aceitera General Deheza (AGD)" },
    ];

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        const hoy = new Date();
        const fechaSeleccionada = fecha ? new Date(fecha) : null;

        if (!fecha) {
            newErrors.fecha = "Campo obligatorio";
        } else if (fechaSeleccionada && fechaSeleccionada <= hoy) {
            newErrors.fecha = "Debe seleccionar una fecha posterior a hoy";
        }

        if (!precio) newErrors.precio = "Campo obligatorio";
        if (!origen) newErrors.origen = "Campo obligatorio";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos correctamente");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            const envioPrecio: PrecioForm = {
                fecha_precio: fecha,
                precio_obtenido: precio!,
                origen: origen as TipoOrigenPrecio,
            };
            await postPrecio(envioPrecio);
            toast.success("Precio cargado correctamente, volviendo a página de precios...");
            onSuccess();
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Error al cargar el precio";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-start justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-center text-gray-900">
                        Cargar Precio Actual
                    </h3>
                    <button
                        onClick={onClose}
                        className={`text-gray-400 ml-4 hover:text-gray-600 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <DateInput
                        label="Fecha del precio"
                        value={fecha}
                        onChange={setFecha}
                        error={errors.fecha}
                    />

                    <NumberInput
                        label="Precio obtenido"
                        value={precio}
                        onChange={setPrecio}
                        placeholder="Ej: 420.50"
                        error={errors.precio}
                    />

                    <SelectFilter
                        label="Origen del precio"
                        value={origen}
                        onChange={setOrigen}
                        options={ORIGENES}
                        placeholder="Seleccionar origen"
                        error={errors.origen}
                    />
                </div>

                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className={`btn-secondary px-4 py-2 rounded-md transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                    >
                        <Download className='h-4 w-4'/>
                        <span>{isSubmitting ? "Guardando..." : "Guardar Precio"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrecioModal;