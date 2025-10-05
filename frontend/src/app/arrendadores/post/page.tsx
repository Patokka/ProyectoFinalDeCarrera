'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { ArrendadorForm, Option, TipoCondicion } from '@/lib/type';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import { postArrendador } from '@/lib/arrendadores/auth';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { Download } from 'lucide-react';

const condicionFiscalOptions = [
    { value: 'MONOTRIBUTISTA', label: 'MONOTRIBUTISTA' },
    { value: 'RESPONSABLE_INSCRIPTO', label: 'RESPONSABLE INSCRIPTO' },
    { value: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO', label: 'EXENTO / RESPONSABLE NO INSCRIPTO' }
];

const initialFormData: ArrendadorForm = {
    nombre_o_razon_social: '',
    cuil: '',
    condicion_fiscal: 'MONOTRIBUTISTA',
    mail: '',
    telefono: '',
    localidad_id: 0,
    descripcion: ''
};

export default function CrearArrendadorPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ArrendadorForm>(initialFormData);
    const [provincias, setProvincias] = useState<Option[]>([]);
    const [localidades, setLocalidades] = useState<Option[]>([]);
    const [provinciaActual, setProvinciaActual] = useState<Option>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
        ...prev,
        [field]: field === 'localidad_id' ? Number(value) : value
        }));

        if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre_o_razon_social.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.cuil) {
            newErrors.cuil = "Campo obligatorio";
        } else if (!validarCuilCuit(formData.cuil)) {
            newErrors.cuil = "CUIL inválido";
        }
        if (!provinciaActual) newErrors.provincia = 'Campo obligatorio';
        if (!formData.localidad_id) newErrors.localidad = 'Campo obligatorio';
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Email inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const guardarArrendador = async () => {
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos obligatorios');
            return;
        }
        try {
            const payload = {
                ...formData,
                cuil: formData.cuil.replace(/-/g, '')
            };
            await postArrendador(payload);
            toast.success('Arrendador guardado con éxito, volviendo a página de arrendadores...');
            router.push('/arrendadores');
        } catch (error: any) {
            // Parseamos el mensaje que devolvió el backend
            const msg = error.message || 'Error al guardar el arrendador';
            if (msg.includes("CUIT - CUIL ya está registrado")) {
                setErrors(prev => ({ ...prev, cuil: "Este CUIT - CUIL ya existe para otro arrendador" }));
                toast.error(msg);
            } else {
                toast.error(msg);
            }
        }
    };

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

        dataProvincias();
    }, []);

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

    return (
    <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Crear Arrendador:</h1>
                            <button
                                onClick={guardarArrendador}
                                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                            >
                                <Download className='h-4 w-4'/>
                                <span>Guardar Arrendador</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <Input
                            label="Nombre o Razón Social"
                            value={formData.nombre_o_razon_social}
                            onChange={(val) => handleInputChange('nombre_o_razon_social', val)}
                            placeholder="Ej: Juan Pérez"
                            error={errors.nombre}
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
                                label="Teléfono (opcional)"
                                value={formData.telefono? formData.telefono : ''}
                                onChange={(val) => {
                                    // Permitís solo dígitos y el +
                                    if (/^[0-9+]*$/.test(val)) {
                                        setFormData({ ...formData, telefono: val });
                                    }
                            }}
                            placeholder="3491696255"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <Input
                                    label="Mail (opcional)"
                                    value={String(formData.mail)}
                                    onChange={(val) => handleInputChange('mail', val)}
                                    placeholder="ejemplo@correo.com"
                                    error={errors.mail}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción (opcional):
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    placeholder="Información adicional sobre el arrendador"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                </div>

                <div className="mt-6">
                    <Link href="/arrendadores" passHref>
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
