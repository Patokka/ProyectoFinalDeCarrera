'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { ArrendatarioDtoOut, ArrendatarioForm, Option, TipoCondicion } from '@/lib/type';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { RotateCcw } from 'lucide-react';
import { fetchArrendatarioById, putArrendatario } from '@/lib/arrendatarios/auth';

/**
 * @constant condicionFiscalOptions
 * @description Opciones para el selector de condición fiscal.
 */
const condicionFiscalOptions = [
    { value: 'MONOTRIBUTISTA', label: 'MONOTRIBUTISTA' },
    { value: 'RESPONSABLE_INSCRIPTO', label: 'RESPONSABLE INSCRIPTO' },
    { value: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO', label: 'EXENTO / RESPONSABLE NO INSCRIPTO' }
];

const initialFormData: ArrendatarioForm = {
    razon_social: '',
    cuit: '',
    condicion_fiscal: 'MONOTRIBUTISTA',
    mail: '',
    localidad_id: 0,
};

/**
 * @page ModificarArrendatarioPage
 * @description Página de formulario para editar los datos de un arrendatario existente.
 * @returns {JSX.Element} El formulario de edición de arrendatario.
 */
export default function ModificarArrendatarioPage() {
    const params = useParams();
    const idArrendatario = params?.id;
    const router = useRouter();
    const [formData, setFormData] = useState<ArrendatarioForm>(initialFormData);
    const [arrendatario, setArrendatario] = useState<ArrendatarioDtoOut>();
    const [provincias, setProvincias] = useState<Option[]>([]);
    const [localidades, setLocalidades] = useState<Option[]>([]);
    const [provinciaActual, setProvinciaActual] = useState<Option>();
    const [localidadActual, setLocalidadActual] = useState<Option>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * @function handleInputChange
     * @description Actualiza el estado del formulario cuando cambia un campo.
     */
    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
        ...prev,
        [field]: field === 'localidad_id' ? Number(value) : value
        }));

        if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    /**
     * @function validateForm
     * @description Valida los campos del formulario antes del envío.
     * @returns {boolean} True si el formulario es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.razon_social.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.cuit) {
            newErrors.cuil = "Campo obligatorio";
        } else if (!validarCuilCuit(formData.cuit)) {
            newErrors.cuil = "CUIL inválido";
        }
        if (!provinciaActual) newErrors.provincia = 'Campo obligatorio';
        if (!formData.localidad_id) newErrors.localidad = 'Campo obligatorio';
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Mail inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function guardarArrendatario
     * @description Valida y guarda los cambios del arrendatario.
     */
    const guardarArrendatario = async () => {
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos obligatorios');
            return;
        }
        try {
            const payload = {
                ...formData,
                cuit: formData.cuit.replace(/-/g, '')
            };
            await putArrendatario(payload, Number(idArrendatario));
            toast.success('Arrendatario guardado con éxito, volviendo a página de arrendadores...');
            router.push('/arrendatarios');
        } catch (error: any) {
            // Parseamos el mensaje que devolvió el backend
            const msg = error.message || 'Error al guardar el arrendatario';
            if (msg.includes("CUIT - CUIL ya está registrado")) {
                setErrors(prev => ({ ...prev, cuil: "Este CUIT - CUIL ya existe para otro arrendatario" }));
                toast.error(msg);
            } else if (msg.includes("nombre ya está registrado")) {
                setErrors(prev => ({ ...prev, nombre: "El nombre ya está registrado para otro arrendatario" }));
                toast.error(msg);
            } else{
                toast.error(msg);
            }
        }
    };

    /**
     * @effect
     * @description Carga datos iniciales (provincias y datos del arrendatario) al montar.
     */
    useEffect(() => {
        const dataProvincias = async () => {
            try {
                const data = await fetchProvincias();
                const options = data.map((a: any) => ({
                value: String(a.id),
                label: a.nombre_provincia,
                }));
                setProvincias(options);
            } catch (err) {
                toast.error('Error al cargar las provincias');
            }
        };
        const loadArrendatario = async () => {
            if (!idArrendatario) {
                setError('Id de arrendatario inválido');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const arr = await fetchArrendatarioById(Number(idArrendatario));
                setArrendatario(arr);
                setFormData({
                    razon_social: arr.razon_social || '',
                    cuit: arr.cuit || '',
                    condicion_fiscal: arr.condicion_fiscal || 'MONOTRIBUTISTA',
                    mail: arr.mail || '',
                    localidad_id: arr.localidad.id || 0,
                })
            } catch (e: any) {
                toast.error('Error al cargar los datos del arrendatario');
                setError('Error al cargar datos');
            } finally {
                setLoading(false);
            }
            };
        dataProvincias();
        loadArrendatario();
    }, []);

    /**
     * @effect
     * @description Carga las localidades cuando se selecciona una provincia.
     */
    useEffect(() => {
        const cargarLocalidades = async () => {
        if (!provinciaActual?.value) {
            setLocalidades([]);
            return;
        }

        try {
            const data = await fetchLocalidades(Number(provinciaActual.value));
            const options = data.map((l: any) => ({
            value: String(l.id),
            label: l.nombre_localidad,
            }));
            setLocalidades(options);
        } catch (err) {
            toast.error('Error cargando localidades');
            setLocalidades([]);
        }
        };

        cargarLocalidades();
    }, [provinciaActual]);

    useEffect(() => {
        if (arrendatario && arrendatario.localidad) {
            if (provincias.length > 0) {
                const provinciaEncontrada = provincias.find((p) => Number(p.value) === arrendatario.localidad.provincia.id);
                if (provinciaEncontrada) {
                    setProvinciaActual(provinciaEncontrada);
                }
            }
            if (localidades.length > 0) {
                const localidadEncontrada = localidades.find((l) => Number(l.value) === arrendatario.localidad.id);
                if (localidadEncontrada) {
                    setLocalidadActual(localidadEncontrada);
                }
            }
        }
    }, [arrendatario]);

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
                <div className="bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-500">Cargando datos del arrendatario...</p>
                </div>
            </ProtectedRoute>
        );
    }
    if (error) {
        return (
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
                <div className="bg-gray-50 p-6">
                <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
                </div>
            </ProtectedRoute>
        );
    }
    if (!arrendatario) {
        return (
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
            <div className="bg-gray-50 p-6">
                <div className="text-center py-12 font-semibold text-gray-700">
                    No se encontró el arrendatario
                </div>
            </div>
            </ProtectedRoute>
        );
    }


    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
        <div className="bg-gray-50 p-6">
            <div className="">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Modificar Arrendatario:</h1>
                            <button
                                onClick={guardarArrendatario}
                                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                            >
                                <RotateCcw className='h-4 w-4'/>
                                <span>Actualizar Arrendatario</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <Input
                            label="Nombre o Razón Social"
                            value={formData.razon_social}
                            onChange={(val) => handleInputChange('razon_social', val)}
                            placeholder="Ej: Juan Pérez"
                            error={errors.nombre}
                        />
                        <Input
                            label="CUIT - CUIL"
                            value={formatCuitDisplay(formData.cuit)}
                            onChange={(val) => {
                                // Permitís solo dígitos y guiones
                                if (/^[0-9-]*$/.test(val)) {
                                    setFormData({ ...formData, cuit: val });
                                }
                            }}
                            placeholder="99-99999999-9"
                            error={errors.cuil}
                        />

                        <SelectFilter
                            options={condicionFiscalOptions}
                            value={formData.condicion_fiscal}
                            onChange={(val) => handleInputChange('condicion_fiscal', val as TipoCondicion)}
                            label="Condición Fiscal"
                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <SelectFilter
                                options={provincias}
                                value={provinciaActual?.value ?? ''}
                                onChange={(val) => {
                                    const selected = provincias.find(p => p.value === val);
                                    setProvinciaActual(selected);
                                    if (errors.provincia) {
                                        setErrors(prev => ({ ...prev, provincia: '' }));
                                    }
                                    }}
                                label="Provincia"
                                error={errors.provincia}
                            />
                            <SelectFilter
                                options={localidades}
                                value={formData.localidad_id}
                                onChange={(val) => handleInputChange('localidad_id', val)}
                                label="Localidad"
                                error={errors.localidad}
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
                    <Link href={`/arrendatarios/${idArrendatario}`} passHref>
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
