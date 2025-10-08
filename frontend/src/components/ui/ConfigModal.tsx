import { useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { updateJobConfig } from "@/lib/reportes/auth";
import { ConfigCard } from "@/lib/type";
import SelectFilter from "./SelectFilter";

export const useConfigModal = () => {
    const [selectedConfigCard, setSelectedConfigCard] = useState<ConfigCard | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [configTime, setConfigTime] = useState("");
    const [configDay, setConfigDay] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = (card: ConfigCard) => {
        setSelectedConfigCard(card);
        setConfigTime("");
        setConfigDay("");
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setSelectedConfigCard(null);
    };

    return {isOpen, openModal, closeModal, selectedConfigCard, configTime, setConfigTime, configDay, setConfigDay, isSubmitting,setIsSubmitting,};
};

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
    }

    export const ConfigModal = ({isOpen, onClose, selectedConfigCard, configTime, setConfigTime, configDay, setConfigDay, isSubmitting, setIsSubmitting, }: ConfigModalProps) => {
    const [isDeactivated, setIsDeactivated] = useState(false);

    if (!isOpen || !selectedConfigCard) return null;

    const handleSave = async () => {
        // Si está activado el reporte, entonces sí requerimos hora
        if (!configTime && !(selectedConfigCard.id === "reporte-pagos" && isDeactivated)) {
            toast.error("Debe seleccionar una hora");
            return;
        }

        const [hour, minute] = configTime ? configTime.split(":").map(Number) : [0, 0];
        const day = configDay ? Number(configDay) : undefined;

        try {
            setIsSubmitting(true);
            await updateJobConfig({
                job_id: selectedConfigCard.jobId,
                hour,
                minute,
                day,
                active: !isDeactivated,
            });
            toast.success("Configuración actualizada");
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Error al guardar la configuración");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-start justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-center text-gray-900">
                {selectedConfigCard.title}
            </h3>
            <button
                onClick={onClose}
                className={`text-gray-400 ml-4 hover:text-gray-600 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            <div className="p-6 space-y-4">
            {/* Hora */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Hora</label>
                <input
                type="time"
                value={configTime}
                onChange={(e) => setConfigTime(e.target.value)}
                className={`w-full border h-10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2  "focus:ring-blue-500"`}
                />
            </div>

            {/* Día (solo si es tipo schedule) */}
            {selectedConfigCard.type === "schedule" && (
                <SelectFilter
                label="Día del mes"
                value={configDay}
                onChange={(val) => setConfigDay(val)}
                options={Array.from({ length: 31 }, (_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1).padStart(2, "0"),
                }))}
                placeholder="Seleccionar día"
                />
            )}

            {/* Checkbox para "reporte-pagos" */}
            {selectedConfigCard.id === "reporte-pagos" && (
                <div className="flex items-center space-x-2 pt-2">
                <input
                    id="disable-report"
                    type="checkbox"
                    checked={isDeactivated}
                    onChange={() => setIsDeactivated(!isDeactivated)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 hover:cursor-pointer"
                />
                <label htmlFor="disable-report" className="text-sm text-gray-700 hover:cursor-pointer">
                    Desactivar envío mensual de este reporte
                </label>
                </div>
            )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                <button
                    onClick={onClose}
                    className={`btn-secondary px-4 py-2 rounded-md transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""} `}
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}pl-2 pr-2`}
                >
                    <Download className="h-5 w-5"/>
                    <span>{isSubmitting ? "Guardando..." : "Guardar Configuración"}</span>
                </button>
            </div>
        </div>
        </div>
    );
};
