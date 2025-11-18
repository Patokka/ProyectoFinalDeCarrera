'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { ArrendatarioForm, Option, TipoCondicion } from '@/lib/type';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { postArrendatario } from '@/lib/arrendatarios/auth';
import { Download } from 'lucide-react';

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
    razon_social: '', cuit: '', condicion_fiscal: 'MONOTRIBUTISTA',
    mail: '', localidad_id: 0,
};

/**
 * @page CrearArrendatarioPage
 * @description Página con el formulario para crear un nuevo arrendatario.
 * @returns {JSX.Element} El formulario de creación de arrendatario.
 */
export default function CrearArrendatarioPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ArrendatarioForm>(initialFormData);
    const [provincias, setProvincias] = useState<Option[]>([]);
    const [localidades, setLocalidades] = useState<Option[]>([]);
    const [provinciaActual, setProvinciaActual] = useState<Option>();
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
     * @description Valida los campos del formulario antes de enviarlo.
     * @returns {boolean} True si el formulario es válido.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.razon_social.trim()) newErrors.razon_social = 'Campo obligatorio';
        if (!formData.cuit) newErrors.cuit = "Campo obligatorio";
        else if (!validarCuilCuit(formData.cuit)) newErrors.cuit = "CUIT inválido";
        if (!provinciaActual) newErrors.provincia = 'Campo obligatorio';
        if (!formData.localidad_id) newErrors.localidad_id = 'Campo obligatorio';
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Mail inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function guardarArrendatario
     * @description Valida y guarda el nuevo arrendatario.
     */
    const guardarArrendatario = async () => {
        if (!validateForm()) return toast.error('Complete los campos obligatorios.');
        try {
            const payload = { ...formData, cuit: formData.cuit.replace(/-/g, '') };
            await postArrendatario(payload);
            toast.success('Arrendatario guardado con éxito.');
            router.push('/arrendatarios');
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar.');
        }
    };

    /**
     * @effect
     * @description Carga la lista de provincias al montar el componente.
     */
    useEffect(() => {
        const dataProvincias = async () => {
            try {
                const data = await fetchProvincias();
                setProvincias(data.map(p => ({ value: String(p.id), label: p.nombre_provincia })));
            } catch (err) {
                toast.error('Error al cargar las provincias');
            }
        };
        dataProvincias();
    }, []);

    /**
     * @effect
     * @description Carga las localidades cuando cambia la provincia seleccionada.
     */
    useEffect(() => {
        const cargarLocalidades = async () => {
            if (!provinciaActual?.value) return setLocalidades([]);
            try {
                const data = await fetchLocalidades(Number(provinciaActual.value));
                setLocalidades(data.map(l => ({ value: String(l.id), label: l.nombre_localidad })));
            } catch (err) {
                toast.error('Error cargando localidades');
            }
        };
        cargarLocalidades();
    }, [provinciaActual]);

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
        {/* ... (resto del JSX sin cambios) */}
        <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Crear Arrendatario</h1>
                    <button onClick={guardarArrendatario} className="btn-primary">
                        <Download size={16}/><span>Guardar Arrendatario</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input label="Razón Social" value={formData.razon_social} onChange={val => handleInputChange('razon_social', val)} error={errors.razon_social} />
                    <Input label="CUIT" value={formatCuitDisplay(formData.cuit)} onChange={val => handleInputChange('cuit', val.replace(/[^0-9]/g, ''))} error={errors.cuit} />
                    <SelectFilter label="Condición Fiscal" options={condicionFiscalOptions} value={formData.condicion_fiscal} onChange={val => handleInputChange('condicion_fiscal', val as TipoCondicion)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <SelectFilter label="Provincia" options={provincias} value={provinciaActual?.value || ''} onChange={val => setProvinciaActual(provincias.find(p => p.value === val))} error={errors.provincia} />
                    <SelectFilter label="Localidad" options={localidades} value={String(formData.localidad_id)} onChange={val => handleInputChange('localidad_id', Number(val))} error={errors.localidad_id} />
                    <Input label="Mail (opcional)" value={formData.mail || ''} onChange={val => handleInputChange('mail', val)} error={errors.mail} />
                </div>
            </div>
            <div className="mt-6">
                <Link href="/arrendatarios"><button className="btn-secondary">Volver</button></Link>
            </div>
        </div>
    </ProtectedRoute>
    );
}
