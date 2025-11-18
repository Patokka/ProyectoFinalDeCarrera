"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import Input from "../ui/Input"; 
import { Recipient } from "@/lib/type";
import { fetchDestinatarios, putCorreos } from "@/lib/configuracion/auth";

interface RecipientsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RecipientsModal({ isOpen, onClose }: RecipientsModalProps) {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (isOpen) {
            const loadDestinatarios = async () => {
                try {
                    setIsLoading(true);
                    const data = await fetchDestinatarios(); // devuelve Recipient[]
                    console.log(data)
                    setRecipients(data); // asignar al estado
                } catch (error:any) {
                    const message = error instanceof Error ? error.message : "Error al cargar los destinatarios";
                    toast.error(message);
                } finally {
                    setIsLoading(false);
                    
                }
            };

            loadDestinatarios();
        }
    }, [isOpen]);

    const handleAddRecipient = () => {
        if (recipients.length >= 10) {
            toast.warning("Máximo de 10 destinatarios alcanzado");
            return;
        }
        const newIndex = recipients.length + 1;
        setRecipients([...recipients, { clave: `DESTINATARIO_${newIndex}`, valor: "" }]);
    };

    const handleRemoveRecipient = (index: number) => {
        setRecipients((prev) => prev.filter((_, i) => i !== index));
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const handleInputChange = (index: number, value: string) => {
        setRecipients((prev) =>
            prev.map((r, i) => (i === index ? { ...r, valor: value } : r))
        );

        if (errors[index]) {
            setErrors((prev) => ({ ...prev, [index]: "" }));
        }
    };

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSave = async () => {
        const newErrors: { [key: number]: string } = {};
        recipients.forEach((r, i) => {
            if (!validateEmail(r.valor)) newErrors[i] = "Mail inválido";
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Por favor, completa todos los campos obligatorios");
            return;
        }

        try {
            setIsSaving(true);
            await putCorreos(recipients)
            toast.success("Destinatarios actualizados con éxito");
            onClose();
        } catch (error) {
            toast.error("Error al guardar los destinatarios");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Configurar Destinatarios
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <p className="text-center text-gray-500">Cargando...</p>
                    ) : (
                        recipients.map((r, i) => (
                            <div key={i} className="flex items-center space-x-2 w-full">
                                <div className="flex-1">
                                    <Input
                                        label={`Mail ${i + 1}`}
                                        value={r.valor}
                                        onChange={(val) => handleInputChange(i, val)}
                                        placeholder={`destinatario${i + 1}@correo.com`}
                                        error={errors[i]}
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveRecipient(i)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4 mt-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <button
                        onClick={handleAddRecipient}
                        className={`flex items-center space-x-2 ${recipients.length >=10 ? "text-gray-400" :"text-green-600 hover:text-green-700 hover:cursor-pointer"}`}
                        disabled={recipients.length >= 10}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Agregar destinatario</span>
                    </button>

                    <button
                        onClick={handleSave}
                        className={`btn-primary flex items-center space-x-2 ${isSaving ? "opacity-50 cursor-not-allowed" : ""} pl-2 pr-2`}
                        disabled={isSaving}
                    >
                        <Download className="w-5 h-5" />
                        <span>{isSaving ? "Guardando..." : "Guardar Configuración"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
