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
    razon_social: '', cuit: '', condicion_fiscal: 'MONOTRIBUTISTA',
    mail: '', localidad_id: 0,
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
     * @description Valida y guarda los cambios del arrendatario.
     */
    const guardarArrendatario = async () => {
        if (!validateForm()) return toast.error('Complete los campos obligatorios.');
        try {
            const payload = { ...formData, cuit: formData.cuit.replace(/-/g, '') };
            await putArrendatario(payload, Number(idArrendatario));
            toast.success('Arrendatario actualizado con éxito.');
            router.push(`/arrendatarios/${idArrendatario}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar.');
        }
    };

    /**
     * @effect
     * @description Carga datos iniciales (provincias y datos del arrendatario) al montar.
     */
    useEffect(() => {
        const loadInitialData = async () => {
            if (!idArrendatario) return setError('ID de arrendatario inválido.');
            try {
                setLoading(true);
                const [provinciasData, arrendatarioData] = await Promise.all([
                    fetchProvincias(),
                    fetchArrendatarioById(Number(idArrendatario))
                ]);
                setProvincias(provinciasData.map(p => ({ value: String(p.id), label: p.nombre_provincia })));
                setArrendatario(arrendatarioData);
                setFormData({
                    razon_social: arrendatarioData.razon_social,
                    cuit: arrendatarioData.cuit,
                    condicion_fiscal: arrendatarioData.condicion_fiscal,
                    mail: arrendatarioData.mail || '',
                    localidad_id: arrendatarioData.localidad.id,
                });
                const prov = provinciasData.find(p => p.id === arrendatarioData.localidad.provincia.id);
                if (prov) setProvinciaActual({ value: String(prov.id), label: prov.nombre_provincia });
            } catch (err) {
                toast.error('Error al cargar datos.');
                setError('Error al cargar datos.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [idArrendatario]);

    /**
     * @effect
     * @description Carga las localidades cuando se selecciona una provincia.
     */
    useEffect(() => {
        const cargarLocalidades = async () => {
            if (!provinciaActual?.value) return setLocalidades([]);
            try {
                const data = await fetchLocalidades(Number(provinciaActual.value));
                setLocalidades(data.map(l => ({ value: String(l.id), label: l.nombre_localidad })));
            } catch (err) {
                toast.error('Error cargando localidades.');
            }
        };
        cargarLocalidades();
    }, [provinciaActual]);

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!arrendatario) return <ProtectedRoute><div className="p-6 text-center">Arrendatario no encontrado.</div></ProtectedRoute>;

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
        {/* ... (resto del JSX sin cambios) */}
        <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Modificar Arrendatario</h1>
                    <button onClick={guardarArrendatario} className="btn-primary">
                        <RotateCcw size={16}/><span>Actualizar Arrendatario</span>
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
                <Link href={`/arrendatarios/${idArrendatario}`}><button className="btn-secondary">Volver</button></Link>
            </div>
        </div>
    </ProtectedRoute>
    );
}
