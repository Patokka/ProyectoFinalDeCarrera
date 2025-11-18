'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, X } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import DateInput from '../ui/DateInput';
import SelectFilter from '../ui/SelectFilter';
import { PrecioForm, TipoOrigenPrecio } from '@/lib/type';
import { postPrecio } from '@/lib/precios/auth';

/**
 * @interface PrecioModalProps
 * @description Propiedades para el componente PrecioModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} onSuccess - Callback a ejecutar tras guardar un precio.
 */
interface PrecioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * @component PrecioModal
 * @description Un modal para cargar manualmente un nuevo registro de precio.
 * @param {PrecioModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal o `null` si está cerrado.
 */
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

    /**
     * @function validateForm
     * @description Valida los campos del formulario.
     * @returns {boolean} `true` si es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!fecha) newErrors.fecha = "Campo obligatorio";
        if (precio === undefined || precio <= 0) newErrors.precio = "Debe ser un número positivo";
        if (!origen) newErrors.origen = "Campo obligatorio";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleSubmit
     * @description Valida y envía el nuevo precio a la API.
     */
    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            const envioPrecio: PrecioForm = { fecha_precio: fecha, precio_obtenido: precio!, origen: origen as TipoOrigenPrecio };
            await postPrecio(envioPrecio);
            toast.success("Precio cargado correctamente.");
            onSuccess();
            handleClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al cargar el precio";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado.
     */
    const handleClose = () => {
        setFecha("");
        setPrecio(undefined);
        setOrigen("");
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-start justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">Cargar Precio</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <DateInput label="Fecha del precio" value={fecha} onChange={setFecha} error={errors.fecha} />
                    <NumberInput label="Precio obtenido" value={precio} min={0} step={0.01} onChange={setPrecio} error={errors.precio} />
                    <SelectFilter label="Origen del precio" value={origen} onChange={setOrigen} options={ORIGENES} error={errors.origen} />
                </div>

                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
                        <Download size={16} /><span>{isSubmitting ? "Guardando..." : "Guardar Precio"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrecioModal;
