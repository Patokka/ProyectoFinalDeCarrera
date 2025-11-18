import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { updateJobConfig, fetchJobConfig } from "@/lib/reportes/auth";
import { ConfigCard } from "@/lib/type";
import SelectFilter from "./SelectFilter";

/**
 * @hook useConfigModal
 * @description Un hook personalizado para gestionar el estado y la lógica de `ConfigModal`.
 *              Encapsula el estado de apertura, la tarjeta de configuración seleccionada,
 *              los valores de tiempo y día, y el estado de envío.
 * @returns {object} Un objeto con el estado y las funciones para controlar el modal.
 */
export const useConfigModal = () => {
    const [selectedConfigCard, setSelectedConfigCard] = useState<ConfigCard | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [configTime, setConfigTime] = useState("");
    const [configDay, setConfigDay] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeactivated, setIsDeactivated] = useState(false);

    /**
     * @function openModal
     * @description Abre el modal y carga la configuración actual para la tarjeta seleccionada.
     */
    const openModal = async (card: ConfigCard) => {
        setSelectedConfigCard(card);
        setIsOpen(true);
        try {
            const data = await fetchJobConfig(card.jobId);
            if (data) {
                setConfigDay(data.day ? String(data.day) : "");
                setConfigTime(`${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`);
                setIsDeactivated(!data.active);
            }
        } catch (error) {
            toast.error("Error al cargar la configuración");
        }
    };

    /**
     * @function closeModal
     * @description Cierra el modal y resetea su estado.
     */
    const closeModal = () => {
        setIsOpen(false);
        setSelectedConfigCard(null);
        setConfigTime("");
        setConfigDay("");
    };

    return {isOpen, openModal, closeModal, selectedConfigCard, configTime, setConfigTime, configDay, setConfigDay, isSubmitting, setIsSubmitting, isDeactivated, setIsDeactivated};
};

/**
 * @interface ConfigModalProps
 * @description Propiedades para el componente ConfigModal.
 */
interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedConfigCard: ConfigCard | null;
    configTime: string;
    setConfigTime: (val: string) => void;
    configDay: string;
    setConfigDay: (val: string) => void;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    isDeactivated: boolean;
    setIsDeactivated: (val: boolean) => void;
}

/**
 * @component ConfigModal
 * @description Un modal para configurar los parámetros de una tarea programada (job),
 *              como la hora y el día de ejecución.
 * @param {ConfigModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de configuración o `null` si está cerrado.
 */
export const ConfigModal = ({isOpen, onClose, selectedConfigCard, configTime, setConfigTime, configDay, setConfigDay, isSubmitting, setIsSubmitting, isDeactivated, setIsDeactivated}: ConfigModalProps) => {
    if (!isOpen || !selectedConfigCard) return null;

    /**
     * @function handleSave
     * @description Valida y guarda la nueva configuración de la tarea programada.
     */
    const handleSave = async () => {
        if (!configTime && !isDeactivated) {
            return toast.error("Debe seleccionar una hora.");
        }
        const [hour, minute] = configTime ? configTime.split(":").map(Number) : [0, 0];
        const day = configDay ? Number(configDay) : undefined;

        try {
            setIsSubmitting(true);
            await updateJobConfig({ job_id: selectedConfigCard.jobId, hour, minute, day, active: !isDeactivated });
            toast.success("Configuración actualizada.");
            onClose();
        } catch (e) {
            toast.error("Error al guardar la configuración.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-start justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">{selectedConfigCard.title}</h3>
                    <button onClick={onClose} disabled={isSubmitting} className="btn-icon-gray"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="label-class">Hora</label>
                        <input type="time" value={configTime} onChange={e => setConfigTime(e.target.value)} className="input-field" />
                    </div>
                    {selectedConfigCard.type === "schedule" && (
                        <SelectFilter
                            label="Día del mes"
                            value={configDay}
                            onChange={setConfigDay}
                            options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, "0") }))}
                        />
                    )}
                    {selectedConfigCard.id === "reporte-pagos" && (
                        <div className="flex items-center space-x-2 pt-2">
                            <input id="disable-report" type="checkbox" checked={isDeactivated} onChange={() => setIsDeactivated(!isDeactivated)} className="checkbox-class" />
                            <label htmlFor="disable-report" className="text-sm">Desactivar envío de este reporte</label>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={onClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
                        <Download size={16} /><span>{isSubmitting ? "Guardando..." : "Guardar"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
