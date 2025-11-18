"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import PasswordInput from "./PasswordInput";
import { cambiarContrasena } from "@/lib/usuarios/auth";

/**
 * @interface CambiarContrasenaModalProps
 * @description Propiedades para el componente CambiarContrasenaModal.
 * @property {boolean} isOpen - Indica si el modal está abierto.
 * @property {() => void} onClose - Función para cerrar el modal.
 * @property {() => void} [onSuccess] - Callback opcional para después de un cambio exitoso.
 */
interface CambiarContrasenaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * @component CambiarContrasenaModal
 * @description Un modal que proporciona un formulario para que el usuario
 *              pueda cambiar su propia contraseña.
 * @param {CambiarContrasenaModalProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} El modal o `null` si no está abierto.
 */
const CambiarContrasenaModal: React.FC<CambiarContrasenaModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * @function handleClose
     * @description Cierra el modal y resetea su estado.
     */
    const handleClose = () => {
        setCurrentPassword("");
        setNewPassword("");
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    /**
     * @function validateForm
     * @description Valida los campos de contraseña.
     * @returns {boolean} `true` si la validación es exitosa.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!currentPassword) newErrors.currentPassword = "Campo obligatorio";
        if (!newPassword) newErrors.newPassword = "Campo obligatorio";
        else if (newPassword.length < 6 || (newPassword.match(/\d/g) || []).length < 2) {
            newErrors.newPassword = "Debe tener al menos 6 caracteres y 2 números";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function handleGuardar
     * @description Valida y envía la solicitud para cambiar la contraseña.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            await cambiarContrasena(currentPassword, newPassword);
            toast.success("Contraseña actualizada con éxito.");
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || "Error al cambiar la contraseña");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-semibold">Cambiar Contraseña</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-icon-gray">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <PasswordInput
                        label="Contraseña actual"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        error={errors.currentPassword}
                    />
                    <PasswordInput
                        label="Nueva contraseña"
                        value={newPassword}
                        onChange={setNewPassword}
                        error={errors.newPassword}
                    />
                </div>

                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSubmitting} className="btn-primary">
                        <Download size={16} />
                        <span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CambiarContrasenaModal;
