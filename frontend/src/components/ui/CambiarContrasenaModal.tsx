"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { X, Download } from "lucide-react";
import PasswordInput from "./PasswordInput"; // Asegúrate de importar correctamente tu componente
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
const CambiarContrasenaModal: React.FC<CambiarContrasenaModalProps> = ({isOpen, onClose, onSuccess,}) => {
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

        if (!currentPassword) {
            newErrors.currentPassword = "Campo obligatorio";
        }
        if (!newPassword) {
            newErrors.newPassword = "Campo obligatorio";
        } else {
            if (newPassword.length < 6) {
                newErrors.newPassword = "Debe tener al menos 6 caracteres";
            }
            const digitCount = newPassword.replace(/[^0-9]/g, "").length;
            if (digitCount < 2) {
                newErrors.newPassword = "Debe contener al menos 2 números";
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Por favor, completa todos los campos correctamente");
            return false;
        }

        return true;
    };

    /**
     * @function handleGuardar
     * @description Valida y envía la solicitud para cambiar la contraseña.
     */
    const handleGuardar = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            // TODO: Reemplazar con tu fetch real
            await cambiarContrasena(currentPassword, newPassword );

            toast.success("Contraseña actualizada con éxito, volviendo al detalle del usuario...");
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setCurrentPassword("");
            setNewPassword("");
            setErrors({});
            setIsSubmitting(false);

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error.message || "Error al cambiar la contraseña";
            toast.error(msg);
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
                        Cambiar Contraseña
                    </h3>
                    <button
                        onClick={handleClose}
                        className={`text-gray-400 ml-4 hover:text-gray-600 ${
                            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <PasswordInput
                        label="Contraseña actual"
                        placeholder="Ingrese su contraseña actual"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        error={errors.currentPassword}
                    />

                    <PasswordInput
                        label="Nueva contraseña"
                        placeholder="Ingrese la nueva contraseña"
                        value={newPassword}
                        onChange={setNewPassword}
                        error={errors.newPassword}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        className={`btn-secondary px-4 py-2 rounded-md transition-colors ${
                            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={isSubmitting}
                        className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        <Download className="h-4 w-4" />
                        <span>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CambiarContrasenaModal;
