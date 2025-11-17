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

const rolesOptions = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador' },
    { value: 'CONSULTA', label: 'Consulta' }
];

const initialFormData: UsuarioForm = {
    nombre: '',
    apellido: '',
    contrasena: '',
    mail: '',
    cuil: '',
    rol: 'CONSULTA' as TipoRol
};

export default function CrearUsuarioPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<UsuarioForm>(initialFormData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
        ...prev,
        [field]: value
        }));

        if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.nombre.trim()) newErrors.apellido = 'Campo obligatorio';
        if (!formData.contrasena.trim()) {
            newErrors.contrasena = 'Campo obligatorio';
        } else {
            //longitud mínima y cantidad de dígitos
            const tieneLongitud = formData.contrasena.length >= 6;
            const numeros = (formData.contrasena.match(/\d/g) || []).length;
            const tieneDosNumeros = numeros >= 2;
            if (!tieneLongitud || !tieneDosNumeros) {
                newErrors.contrasena = 'Debe tener al menos 6 caracteres y 2 números';
            }
        }
        if (!formData.cuil) {
            newErrors.cuil = "Campo obligatorio";
        } else if (!validarCuilCuit(formData.cuil)) {
            newErrors.cuil = "CUIL inválido";
        }
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Mail inválido';
        if (!formData.rol.trim()) newErrors.rol = 'Campo obligatorio';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const guardarUsuario = async () => {
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos obligatorios');
            return;
        }
        try {
            const payload = {
                ...formData,
                cuil: formData.cuil.replace(/-/g, '')
            };
            if (!payload.mail || payload.mail.trim() === "") {
                delete payload.mail;
            }
            await postUsuario(payload);
            toast.success('Usuario guardado con éxito, volviendo a página de usuarios...');
            router.push('/usuarios');
        } catch (error: any) {
            // Parseamos el mensaje que devolvió el backend
            const msg = error.message || 'Error al guardar el usuarios';
            if (msg.includes("CUIT - CUIL ya está registrado")) {
                setErrors(prev => ({ ...prev, cuil: "Este CUIT - CUIL ya existe para otro usuario" }));
                toast.error(msg);
            } else {
                toast.error(msg);
            }
        }
    };

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
        <div className="bg-gray-50 p-6">
            <div className="">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Crear Usuario:</h1>
                            <button
                                onClick={guardarUsuario}
                                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                            >
                                <Download className='h-4 w-4'/>
                                <span>Guardar Usuario</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <Input
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(val) => handleInputChange('nombre', val)}
                            placeholder="Ej: Juan"
                            error={errors.nombre}
                        />
                        <Input
                            label="Apellido"
                            value={formData.apellido}
                            onChange={(val) => handleInputChange('apellido', val)}
                            placeholder="Ej: Perez"
                            error={errors.apellido}
                        />
                        <Input
                            label="CUIT - CUIL"
                            value={formatCuitDisplay(formData.cuil)}
                            onChange={(val) => {
                                // Permitís solo dígitos y guiones
                                if (/^[0-9-]*$/.test(val)) {
                                    setFormData({ ...formData, cuil: val });
                                }
                            }}
                            placeholder="99-99999999-9"
                            error={errors.cuil}
                        />
                        <SelectFilter
                            options={rolesOptions}
                            value={formData.rol}
                            onChange={(val) => handleInputChange('rol', val as TipoRol)}
                            label="Rol"
                        />
                        <PasswordInput
                            label="Contraseña"
                            value={formData.contrasena}
                            onChange={(val) => handleInputChange('contrasena', val)}
                            placeholder="Requisitos: 6 caracteres y 2 números"
                            error={errors.contrasena}
                        />
                        <Input
                            label="Mail (opcional)"
                            value={String(formData.mail)}
                            onChange={(val) => handleInputChange('mail', val)}
                            placeholder="ejemplo@correo.com"
                            error={errors.mail}
                        />
                        </div>
                </div>
                <div className="mt-6">
                    <Link href="/usuarios" passHref>
                        <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                            Volver
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    </ProtectedRoute>
    );
}
