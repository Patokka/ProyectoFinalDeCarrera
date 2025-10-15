'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { TipoRol, UsuarioDtoOut, UsuarioForm } from '@/lib/type';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { RotateCcw } from 'lucide-react';
import { fetchUsuarioById, putUsuario } from '@/lib/usuarios/auth';
import PasswordInput from '@/components/ui/PasswordInput';

const rolOptions = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador' },
    { value: 'CONSULTA', label: 'Consulta' }
];

const initialFormData: UsuarioForm = {
    nombre: '',
    apellido: '',
    cuil: '',
    contrasena: '',
    mail: '',
    rol: '' as TipoRol
};

export default function ModificarUsuarioPage() {
    const params = useParams();
    const idUsuario = params?.id;
    const router = useRouter();
    const [formData, setFormData] = useState<UsuarioForm>(initialFormData);
    const [usuario, setUsuario] = useState<UsuarioDtoOut>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            await putUsuario(payload, Number(idUsuario));
            toast.success('Usuario guardado con éxito, volviendo a página de usuarios...');
            router.push('/usuarios');
        } catch (error: any) {
            // Parseamos el mensaje que devolvió el backend
            const msg = error.message || 'Error al guardar el usuario';
            if (msg.includes("CUIT - CUIL ya está registrado")) {
                setErrors(prev => ({ ...prev, cuil: "Este CUIT - CUIL ya existe para otro usuario" }));
                toast.error(msg);
            } else{
                toast.error(msg);
            }
        }
    };

    useEffect(() => {
        const loadUsuario = async () => {
            if (!idUsuario) {
                setError('Id de usuario inválido');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const usu = await fetchUsuarioById(Number(idUsuario));
                setUsuario(usu);
                setFormData({
                    nombre: usu.nombre || '',
                    cuil: usu.cuil || '',
                    apellido: usu.apellido || '',
                    mail: usu.mail || '',
                    rol: usu.rol as TipoRol || '',
                    contrasena: ''
                })
            } catch (e: any) {
                toast.error('Error al cargar los datos del usuario');
                setError('Error al cargar datos');
            } finally {
                setLoading(false);
            }
            };
        loadUsuario();
    }, []);

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-500">Cargando datos del usuario...</p>
                </div>
            </ProtectedRoute>
        );
    }
    if (error) {
        return (
            <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
                </div>
            </ProtectedRoute>
        );
    }
    if (!usuario) {
        return (
            <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12 font-semibold text-gray-700">
                    No se encontró el usuario
                </div>
            </div>
            </ProtectedRoute>
        );
    }


    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Modificar Usuario:</h1>
                            <button
                                onClick={guardarUsuario}
                                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                            >
                                <RotateCcw className='h-4 w-4'/>
                                <span>Actualizar Usuario</span>
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
                            options={rolOptions}
                            value={formData.rol}
                            onChange={(val) => handleInputChange('rol', val as TipoRol)}
                            label="Rol"
                        />
                        <Input
                            label="Mail (opcional)"
                            value={String(formData.mail)}
                            onChange={(val) => handleInputChange('mail', val)}
                            placeholder="ejemplo@correo.com"
                            error={errors.mail}
                        />
                        <PasswordInput
                            label="Contraseña"
                            value={formData.contrasena}
                            onChange={(val) => handleInputChange('contrasena', val)}
                            placeholder="Requisitos: 6 caracteres y 2 números"
                            error={errors.contrasena}
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Link href={`/usuarios`} passHref>
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
