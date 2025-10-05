'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { ArrendatarioForm, Option, TipoCondicion } from '@/lib/type';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import { postArrendador } from '@/lib/arrendadores/auth';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { postArrendatario } from '@/lib/arrendatarios/auth';
import { Download } from 'lucide-react';

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

export default function CrearArrendatarioPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ArrendatarioForm>(initialFormData);
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
        if (!formData.razon_social.trim()) newErrors.nombre = 'Campo obligatorio';
        if (!formData.cuit) {
            newErrors.cuit = "Campo obligatorio";
        } else if (!validarCuilCuit(formData.cuit)) {
            newErrors.cuit = "CUIL inválido";
        }
        if (!provinciaActual) newErrors.provincia = 'Campo obligatorio';
        if (!formData.localidad_id) newErrors.localidad = 'Campo obligatorio';
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Email inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
            console.log(payload)
            await postArrendatario(payload);
            toast.success('Arrendatario guardado con éxito, volviendo a página de arrendatarios...');
            router.push('/arrendatarios');
        } catch (error: any) {
            // Parseamos el mensaje que devolvió el backend
            const msg = error.message || 'Error al guardar el arrendatario';
            if (msg.includes("CUIT - CUIL ya está registrado")) {
                setErrors(prev => ({ ...prev, cuit: msg }));
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
                            <h1 className="text-2xl font-bold text-gray-900">Crear Arrendatario:</h1>
                            <button
                                onClick={guardarArrendatario}
                                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
                            >
                                <Download className='h-4 w-4'/>
                                <span>Guardar Arrendatario</span>
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
                            placeholder="20-12345678-9"
                            error={errors.cuit}
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
                    <Link href="/arrendatarios" passHref>
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
