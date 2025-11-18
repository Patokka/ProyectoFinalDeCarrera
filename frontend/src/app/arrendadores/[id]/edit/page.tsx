'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner';
import { ArrendadorDtoOut, ArrendadorForm, Option, TipoCondicion } from '@/lib/type';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import { fetchArrendadorById, putArrendador } from '@/lib/arrendadores/auth';
import Input from '@/components/ui/Input';
import { formatCuitDisplay, validarCuilCuit } from '@/lib/helpers';
import { RotateCcw } from 'lucide-react';

/**
 * @constant condicionFiscalOptions
 * @description Opciones para el selector de condición fiscal.
 */
const condicionFiscalOptions = [
    { value: 'MONOTRIBUTISTA', label: 'MONOTRIBUTISTA' },
    { value: 'RESPONSABLE_INSCRIPTO', label: 'RESPONSABLE INSCRIPTO' },
    { value: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO', label: 'EXENTO / RESPONSABLE NO INSCRIPTO' }
];

const initialFormData: ArrendadorForm = {
    nombre_o_razon_social: '', cuil: '', condicion_fiscal: 'MONOTRIBUTISTA',
    mail: '', telefono: '', localidad_id: 0, descripcion: ''
};

/**
 * @page ModificarArrendadorPage
 * @description Página de formulario para editar los datos de un arrendador existente.
 *              Carga los datos actuales del arrendador y permite al usuario modificarlos
 *              y guardarlos.
 * @returns {JSX.Element} El formulario de edición de arrendador.
 */
export default function ModificarArrendadorPage() {
    const params = useParams();
    const idArrendador = params?.id;
    const router = useRouter();
    const [formData, setFormData] = useState<ArrendadorForm>(initialFormData);
    const [arrendador, setArrendador] = useState<ArrendadorDtoOut>();
    const [provincias, setProvincias] = useState<Option[]>([]);
    const [localidades, setLocalidades] = useState<Option[]>([]);
    const [provinciaActual, setProvinciaActual] = useState<Option>();
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * @function handleInputChange
     * @description Actualiza el estado del formulario cuando cambia un campo de entrada.
     * @param {string} field - El nombre del campo a actualizar.
     * @param {any} value - El nuevo valor del campo.
     */
    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    /**
     * @function validateForm
     * @description Valida los campos del formulario antes de enviarlo.
     * @returns {boolean} `true` si el formulario es válido, `false` de lo contrario.
     */
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre_o_razon_social.trim()) newErrors.nombre_o_razon_social = 'Campo obligatorio';
        if (!formData.cuil) newErrors.cuil = "Campo obligatorio";
        else if (!validarCuilCuit(formData.cuil)) newErrors.cuil = "CUIL inválido";
        if (!provinciaActual) newErrors.provincia = 'Campo obligatorio';
        if (!formData.localidad_id) newErrors.localidad_id = 'Campo obligatorio';
        if (formData.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) newErrors.mail = 'Email inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @function guardarArrendador
     * @description Valida el formulario y envía los datos actualizados a la API para guardar los cambios.
     */
    const guardarArrendador = async () => {
        if (!validateForm()) {
            toast.error('Por favor, completa todos los campos obligatorios');
            return;
        }
        try {
            const payload = { ...formData, cuil: formData.cuil.replace(/-/g, '') };
            await putArrendador(payload, Number(idArrendador));
            toast.success('Arrendador actualizado con éxito.');
            router.push(`/arrendadores/${idArrendador}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el arrendador');
        }
    };

    /**
     * @effect
     * @description Carga las provincias y los datos del arrendador a editar al montar el componente.
     */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [provinciasData, arrendadorData] = await Promise.all([
                    fetchProvincias(),
                    fetchArrendadorById(Number(idArrendador))
                ]);

                setProvincias(provinciasData.map(p => ({ value: String(p.id), label: p.nombre_provincia })));
                setArrendador(arrendadorData);
                setFormData({
                    nombre_o_razon_social: arrendadorData.nombre_o_razon_social,
                    cuil: arrendadorData.cuil,
                    condicion_fiscal: arrendadorData.condicion_fiscal,
                    mail: arrendadorData.mail || '',
                    telefono: arrendadorData.telefono || '',
                    localidad_id: arrendadorData.localidad.id,
                    descripcion: arrendadorData.descripcion || ''
                });

                const prov = provinciasData.find(p => p.id === arrendadorData.localidad.provincia.id);
                if(prov) setProvinciaActual({ value: String(prov.id), label: prov.nombre_provincia });

            } catch (err) {
                toast.error('Error al cargar datos iniciales.');
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };

        if(idArrendador) loadInitialData();
    }, [idArrendador]);

    /**
     * @effect
     * @description Carga las localidades correspondientes cada vez que se selecciona una nueva provincia.
     */
    useEffect(() => {
        const cargarLocalidades = async () => {
            if (!provinciaActual?.value) {
                setLocalidades([]);
                return;
            }
            try {
                const data = await fetchLocalidades(Number(provinciaActual.value));
                setLocalidades(data.map(l => ({ value: String(l.id), label: l.nombre_localidad })));
            } catch (err) {
                toast.error('Error cargando localidades');
            }
        };
        cargarLocalidades();
    }, [provinciaActual]);

    if (loading) return <ProtectedRoute><div className="p-6 text-center">Cargando...</div></ProtectedRoute>;
    if (error) return <ProtectedRoute><div className="p-6 text-center text-red-600">{error}</div></ProtectedRoute>;
    if (!arrendador) return <ProtectedRoute><div className="p-6 text-center">No se encontró el arrendador.</div></ProtectedRoute>;

    return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
        {/* ... (resto del JSX sin cambios) */}
        <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Modificar Arrendador</h1>
                    <button onClick={guardarArrendador} className="btn-primary">
                        <RotateCcw size={16}/><span>Actualizar Arrendador</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input label="Nombre o Razón Social" value={formData.nombre_o_razon_social} onChange={val => handleInputChange('nombre_o_razon_social', val)} error={errors.nombre_o_razon_social} />
                    <Input label="CUIT - CUIL" value={formatCuitDisplay(formData.cuil)} onChange={val => handleInputChange('cuil', val.replace(/[^0-9]/g, ''))} error={errors.cuil} />
                    <SelectFilter label="Condición Fiscal" options={condicionFiscalOptions} value={formData.condicion_fiscal} onChange={val => handleInputChange('condicion_fiscal', val as TipoCondicion)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <SelectFilter label="Provincia" options={provincias} value={provinciaActual?.value || ''} onChange={val => setProvinciaActual(provincias.find(p => p.value === val))} error={errors.provincia} />
                    <SelectFilter label="Localidad" options={localidades} value={String(formData.localidad_id)} onChange={val => handleInputChange('localidad_id', Number(val))} error={errors.localidad_id} />
                    <Input label="Teléfono (opcional)" value={formData.telefono || ''} onChange={val => handleInputChange('telefono', val)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Input label="Mail (opcional)" value={formData.mail || ''} onChange={val => handleInputChange('mail', val)} error={errors.mail} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional):</label>
                        <textarea value={formData.descripcion || ''} onChange={e => handleInputChange('descripcion', e.target.value)} rows={3} className="input-field" />
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <Link href={`/arrendadores/${idArrendador}`}><button className="btn-secondary">Volver</button></Link>
            </div>
        </div>
    </ProtectedRoute>
    );
}
