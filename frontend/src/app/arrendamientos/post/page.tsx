'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
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


// Opciones para los selectores
const tipoOptions = [
  { value: 'FIJO', label: 'FIJO' },
  { value: 'A_PORCENTAJE', label: 'APARCERIA' }
];

const plazoOptions = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'CUATRIMESTRAL', label: 'Cuatrimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' }
];

const promedioOptions = [
  { value: 'ULTIMOS_5_HABILES', label: 'Últimos 5 días hábiles del mes anterior al pago' },
  { value: 'ULTIMOS_10_HABILES', label: 'Últimos 10 días hábiles del mes anterior al pago' },
  { value: 'ULTIMO_MES', label: 'Mes anterior al pago' },
  { value: 'DEL_10_AL_15_MES_ACTUAL', label: 'Precios del día 10 al día 15 del mes actual al pago' }
];

const fuenteOptions = [
  { value: 'BCR', label: 'BCR' },
  { value: 'AGD', label: 'AGD' }
];

//datos iniciales del form:
const initialFormData: ArrendamientoForm = {
  tipo: 'FIJO',
  localidad_id: 0,
  usuario_id: 0,
  arrendatario_id: 0,
  fecha_inicio: '',
  fecha_fin: '',
  quintales: 0.0,
  hectareas: 0.0,
  plazo_pago: 'MENSUAL',
  dias_promedio: 'ULTIMOS_5_HABILES',
  origen_precio: 'BCR',
  porcentaje_aparceria: 0,
  descripcion: ''
};



export default function CrearArrendamientoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ArrendamientoForm>(initialFormData);
  const [participaciones, setParticipaciones] = useState<ParticipacionArrendador[]>([]);
  const [nuevoArrendador, setNuevoArrendador] = useState<ParticipacionArrendador>({
    arrendador_id: 0,
    hectareas_asignadas: 0,
    quintales_asignados: 0,
    porcentaje: 0,
    observacion: '',
  });
  const [arrendadores, setArrendadores] = useState<Option[]>([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [arrendatarios, setArrendatarios] = useState<Option[]>([]);
  const [provincias, setProvincias] = useState<Option[]>([]);
  const [localidades, setLocalidades] = useState<Option[]>([]);
  const [provinciaActual, setProvinciaActual] = useState<Option>();  
  // Calcular totales
  const totalHectareas = participaciones.reduce((sum, p) => sum + (p.hectareas_asignadas || 0), 0);
  const totalQuintales = participaciones.reduce((sum, p) => sum + (p.quintales_asignados || 0), 0);



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: ["localidad_id", "arrendatario_id", ].includes(field)
            ? Number(value)
            : value
    }));
  };

  const handleNumberChange = (field: string, value: number|undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const agregarArrendador = () => {
    if (!nuevoArrendador.arrendador_id) return;
    if (participaciones.some((a) => a.arrendador_id === nuevoArrendador.arrendador_id)){
      toast.error("El arrendador ya ha sido agregado");
      return;
    }
    setParticipaciones((prev) => [...prev, nuevoArrendador]);
    setNuevoArrendador({
      arrendador_id: NaN,
      hectareas_asignadas: 0,
      quintales_asignados: 0,
      porcentaje: 0,
      observacion: '',
    });
  };


  const eliminarArrendador = (id: number) => {
    setParticipaciones(participaciones.filter(p => p.arrendador_id !== Number(id)));
  };
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const guardarArrendamiento = async () => {
    // Validaciones
      const newErrors: { [key: string]: string } = {};
      if (!formData.arrendatario_id) newErrors.arrendatario = "Campo obligatorio";
      if (!formData.localidad_id) newErrors.localidad = "Campo obligatorio";
      if (!formData.fecha_inicio) newErrors.fechaInicio = "Campo obligatorio";
      if (!formData.fecha_fin) newErrors.fechaFin = "Campo obligatorio";
      if (!formData.hectareas) newErrors.hectareas = "Campo obligatorio";
      if (!formData.quintales) newErrors.quintalesPorHectarea = "Campo obligatorio";
      if (!formData.porcentaje_aparceria && formData.tipo == "A_PORCENTAJE") newErrors.porcentajeProduccion = "Campo obligatorio"
      if (formData.fecha_inicio && formData.fecha_fin) {
        const inicio = new Date(formData.fecha_inicio);
        const fin = new Date(formData.fecha_fin);
        if (inicio >= fin) {
          newErrors.fechaInicio = "La fecha de inicio debe ser anterior a la fecha de fin";
        } else {
          const minimoFin = new Date(inicio);
          minimoFin.setFullYear(minimoFin.getFullYear() + 1);

          if (fin < minimoFin) {
            newErrors.fechaFin = `La fecha de fin debe ser al menos 1 año posterior a la fecha de inicio`;
          }
        }
      }
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        toast.error("Por favor, completa todos los campos obligatorios");
        return;
      }
    if (formData.tipo === 'FIJO') {
      const hectareasArrendamiento = formData.hectareas || 0;
      const quintalesArrendamiento = formData.quintales || 0;
      if (Math.abs(totalHectareas - hectareasArrendamiento) > 0.01 || Math.abs(totalQuintales - quintalesArrendamiento) > 0.01) {
        toast.error(`La suma de hectáreas y quintales de los arrendadores (${totalHectareas}) debe ser igual a las hectáreas y quintales del arrendamiento (${hectareasArrendamiento})`)
        return;
      }
    }

    if (participaciones.length === 0) {
      toast.error("Error al guardar el arrendamiento")      
      return;
    }

    //Lógica para guardar en el backend
    try {
      const respuesta = await postArrendamiento(formData);

      let participacionesAEnviar = participaciones;

      if (formData.tipo === "A_PORCENTAJE" && formData.porcentaje_aparceria) {
        const porcentajePorArrendador = formData.porcentaje_aparceria / participaciones.length;

        participacionesAEnviar = participaciones.map((p) => ({
          ...p,
          porcentaje: porcentajePorArrendador,
        }));
      }

      await postParticipaciones(participacionesAEnviar, respuesta.id);
      await generarCuotas(respuesta.id);
    } catch (e) {
      toast.error("Error al guardar el arrendamiento");
    }
    toast.success("Arrendamiento guardado con éxito")
    router.push("/arrendamientos")
  };

  useEffect(() => {   
    //Sesión
    const usuarioString = localStorage.getItem('user');
    if (usuarioString) {
      try {
        const usuario = JSON.parse(usuarioString);
        setNombreUsuario(`${usuario.nombre} ${usuario.apellido}`);
        setFormData((prev) => ({
          ...prev,
          usuario_id: usuario.id
        }));
      } catch (error) {
        toast.error("Error al obtener el usuario logueado")
      }
    }

    //Carga arrendatarios
    const dataArrendatarios = async() =>{
      try {
        const data = await fetchArrendatarios();
        const options = data.map((a) => ({
          value: String(a.id),
          label: a.razon_social,
      }));
        setArrendatarios(options);
      }catch(err){
        toast.error('Error al cargar los arrendatarios');
      }
    };

    //Carga provincias
    const dataProvincias = async() =>{
      try {
        const data = await fetchProvincias();
        const options = data.map((a) => ({
          value: String(a.id),
          label: a.nombre_provincia,
      }));
        setProvincias(options);
      }catch(err){
        toast.error('Error al cargar las provincias');
      }
    };

    //Carga arrendadores
    const dataArrendadores = async() =>{
      try {
        const data = await fetchArrendadores();
        const options = data.map((a) => ({
          value: String(a.id),
          label: a.nombre_o_razon_social,
      }));
        setArrendadores(options);
      }catch(err){
        toast.error('Error al cargar los arrendadores');
      }
    };
    //Llamada funciones
    dataArrendatarios();
    dataProvincias();
    dataArrendadores();
  }, []);

  useEffect(() =>{
  const cargarLocalidades = async () => {
    if (!provinciaActual?.value) {
      setLocalidades([]);
      return;
    }

    try {
      const data = await fetchLocalidades(Number(provinciaActual.value));
      const options = data.map((l) => ({
        value: String(l.id),
        label: l.nombre_localidad,
      }));
      setLocalidades(options);
    } catch (err) {
      toast.error("Error cargando localidades");
      setLocalidades([]);
    }
  };
  //Se va a ejecutar cada vez que se cambie la provincia
  cargarLocalidades();
}, [provinciaActual]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Crear Arrendamiento:</h1>
              <button 
                onClick={guardarArrendamiento}
                className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <span>Guardar Arrendamiento</span>
              </button>
            </div>

            {/* Primera fila de campos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario:</label>
                <input
                  type="text"
                  value={nombreUsuario}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-500
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm hover:cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <SelectFilter
                  options={arrendatarios}
                  value={formData.arrendatario_id}
                  onChange={(val) => handleInputChange('arrendatario_id', val)}
                  label="Arrendatario"
                  error={errors.arrendatario}
                />
              </div>

              <div>
                <SelectFilter
                  options={provincias}
                  value={provinciaActual?.value ?? ""}
                  onChange={
                    (val) => {
                        const selected = provincias.find(p => p.value === val);
                        setProvinciaActual(selected);
                      }
                    }
                  label="Provincia"
                  error={errors.provincia}
                  />
              </div>

              <div>
                <SelectFilter
                  options={localidades}
                  value={formData.localidad_id}
                  onChange={(val) => handleInputChange('localidad_id', val)}
                  label="Localidad"
                  error={errors.localidad}
                />
              </div>

              <div>
                  <DateInput
                    label="Fecha Inicio"
                    value={formData.fecha_inicio}
                    onChange={(val) => handleInputChange('fecha_inicio', val)}
                    error={errors.fechaInicio}
                  />
              </div>
              
              <div>
                  <DateInput
                    label="Fecha Fin"
                    value={formData.fecha_fin}
                    onChange={(val) => handleInputChange('fecha_fin', val)}
                    error={errors.fechaFin}
                  />
              </div>
            </div>

            {/* Segunda fila de campos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <NumberInput
                  label="Hectáreas para Arrendador"
                  value={formData.hectareas}
                  min = {1}
                  max = {10000}
                  onChange={(e) => handleNumberChange('hectareas', e)}
                  placeholder='Ej: 99.9'
                  error={errors.hectareas}
                />
              </div>

              <div>
              <NumberInput
                  label="Quintales por Hectárea"
                  value={formData.quintales}
                  min = {1}
                  max = {10000}
                  onChange={(e) => handleNumberChange('quintales', e)}
                  placeholder='Ej: 99.9'
                  error={errors.quintalesPorHectarea}
                />
              </div>

              <div>
                <SelectFilter
                  options={plazoOptions}
                  value={formData.plazo_pago}
                  onChange={(val) => handleInputChange('plazo_pago', val)}
                  label="Plazo de Pago"
                />
              </div>

              <div>
                <SelectFilter
                  options={promedioOptions}
                  value={formData.dias_promedio}
                  onChange={(val) => handleInputChange('dias_promedio', val)}
                  label="Promedio Precio"
                />
              </div>

              <div>
                <SelectFilter
                  options={fuenteOptions}
                  value={formData.origen_precio}
                  onChange={(val) => handleInputChange('origen_precio', val)}
                  label="Fuente de Precio"
                />
              </div>
            </div>

            {/* Tercera fila - Descripción y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional):</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Ej: El arrendamiento pertenece a (dueño), y el campo está ubicado en la ruta (número)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <SelectFilter
                    options={tipoOptions}
                    value={formData.tipo}
                    onChange={(val) => handleInputChange('tipo', val)}
                    label="Tipo de Arrendamiento"
                  />
                </div>

                {formData.tipo === 'A_PORCENTAJE' && (
                  <div>
                    <div className="flex items-center space-x-2">
                      <NumberInput
                        label="Porcentaje Producción"
                        value={formData.porcentaje_aparceria}
                        min = {0}
                        max = {100}
                        step={0.5}
                        onChange={(value) => handleNumberChange('porcentaje_aparceria', value)}
                        error={errors.porcentajeProduccion}               
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Arrendadores */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Arrendador/es:</h2>
            
            {/* Formulario para agregar arrendador */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <ArrendadorSelect
                  arrendadores={arrendadores}
                  onSelect={(arrendador) =>
                    setNuevoArrendador({
                      ...nuevoArrendador,
                      arrendador_id: Number(arrendador)
                    })
                  }
                  label="Nombre o Razón Social"
                  placeholder="ej: Nordesan"
                />
              </div>

              {formData.tipo === 'FIJO' && (
                <>
                  <div> 
                    <NumberInput
                        label="Hectáreas para Arrendador"
                        value={nuevoArrendador.hectareas_asignadas}
                        min = {1}
                        max = {10000}
                        onChange={(e) => setNuevoArrendador({...nuevoArrendador, hectareas_asignadas: Number(e)})}
                        placeholder='Ej: 99.9'
                    />
                  </div>

                  <div>
                    <NumberInput
                        label="Quintales por Hectárea para Arrendador"
                        value={nuevoArrendador.quintales_asignados}
                        min = {1}
                        max = {10000}
                        onChange={(e) => setNuevoArrendador({...nuevoArrendador, quintales_asignados: Number(e)})}
                        placeholder='Ej: 99.9'
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <button
                  onClick={agregarArrendador}
                  className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors w-full justify-center"
                >
                  <span>Agregar Arrendador</span>
                </button>
              </div>
            </div>
            <div className='mb-3'>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  value={nuevoArrendador.observacion}
                  onChange={(e) => setNuevoArrendador({...nuevoArrendador, observacion: e.target.value})}
                  rows={1}
                  className="min-h-2 w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observación del arrendador"
                  />
            </div>
        
            {/* Tabla de arrendadores */}
            {participaciones.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                      </th>
                      {formData.tipo === "FIJO" && (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Hectáreas Asignadas
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Quintales por Hectárea
                          </th>
                        </>
                      )}
                      {formData.tipo === "A_PORCENTAJE" && (
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Porcentaje Producción
                        </th>
                      )}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Observación
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {participaciones.map((participacion) => (
                      <tr key={participacion.arrendador_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendadores.find(a => Number(a.value) === participacion.arrendador_id)?.label}
                        </td>

                        {formData.tipo === "FIJO" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {participacion.hectareas_asignadas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {participacion.quintales_asignados}
                            </td>
                          </>
                        )}

                        {formData.tipo === "A_PORCENTAJE" && participaciones.length > 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {(formData.porcentaje_aparceria / participaciones.length).toFixed(2)}%
                          </td>
                        )}

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {participacion.observacion || "-"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => eliminarArrendador(participacion.arrendador_id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors inline-flex"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {formData.tipo === "FIJO" && (
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-3 text-sm text-gray-900">Total:</td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-center">
                          {totalHectareas.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-center">
                          {totalQuintales.toFixed(1)}
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            )}

            {participaciones.length === 0 && (
              <div className="text-center py-0 text-gray-500">
                <p>*El arrendamiento debe contar con al menos un arrendador.</p>
              </div>
            )}
          </div>

          {/* Botón Volver */}
          <div className="mt-6">
            <Link href="/arrendamientos" passHref>
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