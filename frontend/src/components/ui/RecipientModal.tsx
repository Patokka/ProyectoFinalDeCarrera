"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import Input from "../ui/Input"; 
import { Recipient } from "@/lib/type";
import { fetchDestinatarios, putCorreos } from "@/lib/configuracion/auth";

/**
 * @interface RecipientsModalProps
 * @description Propiedades para el componente RecipientsModal.
 * @property {boolean} isOpen - Controla la visibilidad del modal.
 * @property {() => void} onClose - Función para cerrar el modal.
 */
interface RecipientsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * @component RecipientsModal
 * @description Un modal para gestionar la lista de correos electrónicos destinatarios
 *              de los reportes automáticos. Permite añadir, editar y eliminar destinatarios.
 * @param {RecipientsModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal de gestión de destinatarios o `null` si está cerrado.
 */
export default function RecipientsModal({ isOpen, onClose }: RecipientsModalProps) {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: number]: string }>({});

    /**
     * @effect
     * @description Carga la lista de destinatarios desde la API cuando se abre el modal.
     */
    useEffect(() => {
        if (isOpen) {
            const loadDestinatarios = async () => {
                try {
                    setIsLoading(true);
                    setRecipients(await fetchDestinatarios());
                } catch (error:any) {
                    toast.error(error.message || "Error al cargar destinatarios");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDestinatarios();
        }
    }, [isOpen]);

    /**
     * @function handleAddRecipient
     * @description Añade un nuevo campo de entrada para un destinatario.
     */
    const handleAddRecipient = () => {
        if (recipients.length >= 10) return toast.warning("Máximo de 10 destinatarios alcanzado.");
        const newKey = `DESTINATARIO_${Date.now()}`; // Clave única temporal
        setRecipients([...recipients, { clave: newKey, valor: "" }]);
    };

    /**
     * @function handleRemoveRecipient
     * @description Elimina un campo de destinatario de la lista.
     */
    const handleRemoveRecipient = (index: number) => {
        setRecipients(prev => prev.filter((_, i) => i !== index));
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    /**
     * @function handleInputChange
     * @description Actualiza el valor de un campo de destinatario.
     */
    const handleInputChange = (index: number, value: string) => {
        setRecipients(prev => prev.map((r, i) => (i === index ? { ...r, valor: value } : r)));
        if (errors[index]) setErrors(prev => ({ ...prev, [index]: "" }));
    };

    /**
     * @function handleSave
     * @description Valida todos los correos y guarda la lista actualizada de destinatarios.
     */
    const handleSave = async () => {
        const newErrors: { [key: number]: string } = {};
        recipients.forEach((r, i) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.valor)) newErrors[i] = "Mail inválido";
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return toast.error("Por favor, corrija los errores.");
        }

        try {
            setIsSaving(true);
            await putCorreos(recipients);
            toast.success("Destinatarios actualizados.");
            onClose();
        } catch (error) {
            toast.error("Error al guardar los destinatarios.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">Configurar Destinatarios</h3>
                    <button onClick={onClose} className="btn-icon-gray"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {isLoading ? <p className="text-center text-gray-500">Cargando...</p> :
                        recipients.map((r, i) => (
                            <div key={i} className="flex items-center space-x-2 w-full">
                                <div className="flex-1">
                                    <Input label={`Mail ${i + 1}`} value={r.valor} onChange={val => handleInputChange(i, val)} error={errors[i]} />
                                </div>
                                <button onClick={() => handleRemoveRecipient(i)} className="btn-icon-red mt-5"><Trash2 size={16} /></button>
                            </div>
                        ))
                    }
                </div>

                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <button onClick={handleAddRecipient} className="btn-link" disabled={recipients.length >= 10}>
                        <Plus size={16} /><span>Agregar destinatario</span>
                    </button>
                    <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
                        <Download size={16} /><span>{isSaving ? "Guardando..." : "Guardar"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
