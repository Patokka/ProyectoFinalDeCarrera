'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { TipoRol, UsuarioForm } from '@/lib/type';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { Download } from 'lucide-react';
import { postUsuario } from '@/lib/usuarios/auth';
import PasswordInput from '@/components/ui/PasswordInput';

/**
 * @constant rolesOptions
 * @description Opciones para el selector de rol de usuario.
 */
const rolesOptions = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador' },
    { value: 'CONSULTA', label: 'Consulta' }
];

const initialFormData: UsuarioForm = {
    nombre: '', apellido: '', contrasena: '', mail: '', cuil: '', rol: 'CONSULTA' as TipoRol
};

/**
 * @page CrearUsuarioPage
 * @description Página con el formulario para crear un nuevo usuario.
 *              Solo accesible para administradores.
 * @returns {JSX.Element} El formulario de creación de usuario.
 */
export default function CrearUsuarioPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<UsuarioForm>(initialFormData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    /**
     * @function handleInputChange
     * @description Actualiza el estado del formulario cuando cambia un campo.
     */
    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    /**
     * @function validateForm
     * @description Valida todos los campos del formulario.
     * @returns {boolean} True si el formulario es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.apellido.trim()) newErrors.apellido = 'Campo obligatorio';
        if (!formData.contrasena.trim()) newErrors.contrasena = 'Campo obligatorio';
        else if (formData.contrasena.length < 6 || (formData.contrasena.match(/\d/g) || []).length < 2) {
            newErrors.contrasena = 'Debe tener al menos 6 caracteres y 2 números';
        }
        if (!formData.cuil) newErrors.cuil = "Campo obligatorio";
        else if (!validarCuilCuit(formData.cuil)) newErrors.cuil = "CUIL inválido";
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Mail inválido';
        if (!formData.rol) newErrors.rol = 'Campo obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function guardarUsuario
     * @description Valida y envía los datos del nuevo usuario a la API.
     */
    const guardarUsuario = async () => {
        if (!validateForm()) return toast.error('Complete los campos obligatorios.');
        try {
            const payload = { ...formData, cuil: formData.cuil.replace(/-/g, '') };
            if (!payload.mail?.trim()) delete payload.mail;
            await postUsuario(payload);
            toast.success('Usuario guardado con éxito.');
            router.push('/usuarios');
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar el usuario.');
        }
    };

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
        <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Crear Usuario</h1>
                    <button onClick={guardarUsuario} className="btn-primary">
                        <Download size={16}/><span>Guardar Usuario</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input label="Nombre" value={formData.nombre} onChange={val => handleInputChange('nombre', val)} error={errors.nombre} />
                    <Input label="Apellido" value={formData.apellido} onChange={val => handleInputChange('apellido', val)} error={errors.apellido} />
                    <Input label="CUIT - CUIL" value={formatCuitDisplay(formData.cuil)} onChange={val => handleInputChange('cuil', val.replace(/[^0-9]/g, ''))} error={errors.cuil} />
                    <SelectFilter label="Rol" options={rolesOptions} value={formData.rol} onChange={val => handleInputChange('rol', val as TipoRol)} error={errors.rol} />
                    <PasswordInput label="Contraseña" value={formData.contrasena} onChange={val => handleInputChange('contrasena', val)} error={errors.contrasena} />
                    <Input label="Mail (opcional)" value={formData.mail || ''} onChange={val => handleInputChange('mail', val)} error={errors.mail} />
                </div>
            </div>
            <div className="mt-6">
                <Link href="/usuarios"><button className="btn-secondary">Volver</button></Link>
            </div>
        </div>
    </ProtectedRoute>
    );
}
