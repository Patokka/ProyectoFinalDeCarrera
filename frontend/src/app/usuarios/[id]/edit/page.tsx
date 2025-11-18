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

/**
 * @constant rolOptions
 * @description Opciones para el selector de rol de usuario.
 */
const rolOptions = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador' },
    { value: 'CONSULTA', label: 'Consulta' }
];

/**
 * @page ModificarUsuarioPage
 * @description Página de formulario para editar un usuario existente.
 *              Solo accesible para administradores.
 * @returns {JSX.Element} El formulario de edición de usuario.
 */
export default function ModificarUsuarioPage() {
    const params = useParams();
    const idUsuario = params?.id;
    const router = useRouter();
    const [formData, setFormData] = useState<UsuarioForm>({ nombre: '', apellido: '', cuil: '', contrasena: '', mail: '', rol: '' as TipoRol });
    const [usuario, setUsuario] = useState<UsuarioDtoOut>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
     * @description Valida los campos del formulario antes del envío.
     * @returns {boolean} True si el formulario es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.apellido.trim()) newErrors.apellido = 'Campo obligatorio';
        if (formData.contrasena && (formData.contrasena.length < 6 || (formData.contrasena.match(/\d/g) || []).length < 2)) {
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
     * @description Valida y envía los datos actualizados del usuario a la API.
     */
    const guardarUsuario = async () => {
        if (!validateForm()) return toast.error('Complete los campos obligatorios.');
        try {
            const payload = {
                ...formData,
                cuil: formData.cuil.replace(/-/g, '')
            };
            if (!payload.mail || payload.mail.trim() === "") {
                delete payload.mail;
            }
            await putUsuario(payload, Number(idUsuario));
            toast.success('Usuario actualizado con éxito.');
            router.push('/usuarios');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el usuario.');
        }
    };

    /**
     * @effect
     * @description Carga los datos del usuario a editar al montar el componente.
     */
    useEffect(() => {
        const loadUsuario = async () => {
            if (!idUsuario) return setError('ID de usuario inválido.');
            try {
                setLoading(true);
                const usu = await fetchUsuarioById(Number(idUsuario));
                setUsuario(usu);
                setFormData({
                    nombre: usu.nombre || '',
                    apellido: usu.apellido || '',
                    cuil: usu.cuil || '',
                    mail: usu.mail || '',
                    rol: usu.rol,
                    contrasena: '' // La contraseña no se precarga por seguridad
                });
            } catch (e: any) {
                toast.error('Error al cargar los datos del usuario');
                setError('Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };
        loadUsuario();
    }, [idUsuario]);

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!usuario) return <ProtectedRoute><div className="p-6 text-center">No se encontró el usuario.</div></ProtectedRoute>;

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
        <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Modificar Usuario</h1>
                    <button onClick={guardarUsuario} className="btn-primary">
                        <RotateCcw size={16}/><span>Actualizar Usuario</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input label="Nombre" value={formData.nombre} onChange={val => handleInputChange('nombre', val)} error={errors.nombre} />
                    <Input label="Apellido" value={formData.apellido} onChange={val => handleInputChange('apellido', val)} error={errors.apellido} />
                    <Input label="CUIT - CUIL" value={formatCuitDisplay(formData.cuil)} onChange={val => handleInputChange('cuil', val.replace(/[^0-9]/g, ''))} error={errors.cuil} />
                    <SelectFilter label="Rol" options={rolOptions} value={formData.rol} onChange={val => handleInputChange('rol', val as TipoRol)} error={errors.rol} />
                    <Input label="Mail (opcional)" value={formData.mail || ''} onChange={val => handleInputChange('mail', val)} error={errors.mail} />
                    <PasswordInput label="Nueva Contraseña (opcional)" value={formData.contrasena} onChange={val => handleInputChange('contrasena', val)} error={errors.contrasena} />
                </div>
            </div>
            <div className="mt-6">
                <Link href="/usuarios"><button className="btn-secondary">Volver</button></Link>
            </div>
        </div>
    </ProtectedRoute>
    );
}
