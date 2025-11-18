'use client';

import { useState, useEffect } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner'
import DateInput from '@/components/ui/DateInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { ArrendadorSelect } from '@/components/ui/ArrendadorSelect';
import { ArrendamientoForm, Option, ParticipacionArrendador } from '@/lib/type';
import { fetchArrendatarios } from '@/lib/arrendatarios/auth';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import { fetchArrendadores } from '@/lib/arrendadores/auth';
import { postArrendamiento, postParticipaciones } from '@/lib/arrendamientos/auth';
import { generarCuotas } from '@/lib/pagos/auth';
import { useRouter } from 'next/navigation';

/**
 * @page CrearArrendamientoPage
 * @description Página con el formulario para crear un nuevo arrendamiento. Permite configurar
 *              todos los detalles del contrato y asignar las participaciones de los arrendadores.
 * @returns {JSX.Element} El formulario de creación de arrendamiento.
 */
export default function CrearArrendamientoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ArrendamientoForm>({
    tipo: 'FIJO', localidad_id: 0, usuario_id: 0, arrendatario_id: 0,
    fecha_inicio: '', fecha_fin: '', quintales: 0.0, hectareas: 0.0,
    plazo_pago: 'MENSUAL', dias_promedio: 'ULTIMOS_5_HABILES',
    origen_precio: 'BCR', porcentaje_aparceria: 0, descripcion: ''
  });
  const [participaciones, setParticipaciones] = useState<ParticipacionArrendador[]>([]);
  const [nuevoArrendador, setNuevoArrendador] = useState<ParticipacionArrendador>({
    arrendador_id: 0, hectareas_asignadas: 0, quintales_asignados: 0, porcentaje: 0, observacion: '',
  });
  const [arrendadores, setArrendadores] = useState<Option[]>([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [arrendatarios, setArrendatarios] = useState<Option[]>([]);
  const [provincias, setProvincias] = useState<Option[]>([]);
  const [localidades, setLocalidades] = useState<Option[]>([]);
  const [provinciaActual, setProvinciaActual] = useState<Option>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const totalHectareas = participaciones.reduce((sum, p) => sum + (p.hectareas_asignadas || 0), 0);

  /**
   * @function handleInputChange
   * @description Actualiza el estado del formulario principal.
   */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * @function handleNumberChange
   * @description Actualiza campos numéricos del formulario.
   */
  const handleNumberChange = (field: string, value: number|undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * @function agregarArrendador
   * @description Añade un arrendador a la tabla de participaciones.
   */
  const agregarArrendador = () => {
    if (!nuevoArrendador.arrendador_id) return toast.error("Seleccione un arrendador.");
    if (participaciones.some(p => p.arrendador_id === nuevoArrendador.arrendador_id)) return toast.error("El arrendador ya ha sido agregado.");

    setParticipaciones(prev => [...prev, nuevoArrendador]);
    setNuevoArrendador({ arrendador_id: 0, hectareas_asignadas: 0, quintales_asignados: 0, porcentaje: 0, observacion: '' });
  };

  /**
   * @function eliminarArrendador
   * @description Elimina un arrendador de la tabla de participaciones.
   */
  const eliminarArrendador = (id: number) => {
    setParticipaciones(participaciones.filter(p => p.arrendador_id !== id));
  };

  /**
   * @function guardarArrendamiento
   * @description Valida y guarda el arrendamiento, sus participaciones y genera las cuotas.
   */
  const guardarArrendamiento = async () => {
    // Validaciones...
    const newErrors: { [key: string]: string } = {};
    // ... Lógica de validación
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return toast.error("Complete los campos obligatorios.");
    if (formData.tipo === 'FIJO' && Math.abs(totalHectareas - (formData.hectareas || 0)) > 0.01) {
      return toast.error(`La suma de hectáreas (${totalHectareas}) debe coincidir con las del arrendamiento (${formData.hectareas}).`);
    }
    if (participaciones.length === 0) return toast.error("Debe agregar al menos un arrendador.");

    try {
      const respuesta = await postArrendamiento(formData);
      // Lógica para preparar y enviar participaciones...
      await postParticipaciones(participaciones, respuesta.id);
      await generarCuotas(respuesta.id);
      toast.success("Arrendamiento guardado con éxito.");
      router.push('/arrendamientos');
    } catch (e) {
      toast.error("Error al guardar el arrendamiento.");
    }
  };

  /**
   * @effect
   * @description Carga datos iniciales (usuario, arrendatarios, provincias, etc.) al montar el componente.
   */
  useEffect(() => {   
    // ... Lógica de carga de datos
  }, []);

  /**
   * @effect
   * @description Carga las localidades cuando cambia la provincia seleccionada.
   */
  useEffect(() =>{
    // ... Lógica de carga de localidades
  }, [provinciaActual]);

  return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
      {/* ... (resto del JSX sin cambios) */}
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Crear Arrendamiento</h1>
              <button onClick={guardarArrendamiento} className="btn-primary">
                <Download size={16}/><span>Guardar</span>
              </button>
            </div>
            {/* ... Campos del formulario ... */}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Arrendador/es:</h2>
            {/* ... Formulario y tabla de participaciones ... */}
          </div>

          <div className="mt-6">
            <Link href="/arrendamientos"><button className="btn-secondary">Volver</button></Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
