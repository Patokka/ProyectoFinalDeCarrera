'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import { toast } from 'sonner'
import DateInput from '@/components/ui/DateInput';
import Input from '@/components/ui/Input';
import { NumberInput } from '@/components/ui/NumberInput';
import { ArrendadorSelect } from '@/components/ui/ArrendadorSelect';
import { Option, ParticipacionArrendador } from '@/lib/type';
import { fetchArrendatarios } from '@/lib/arrendatarios/auth';
import { fetchLocalidades, fetchProvincias } from '@/lib/ubicaciones/auth';
import { fetchArrendadores } from '@/lib/arrendadores/auth';

// Tipos
interface Arrendador {
  id: string;
  nombre: string;
  hectareas: number;
  quintales: number;
}

// Opciones para los selectores
const tipoOptions = [
  { value: 'FIJO', label: 'FIJO' },
  { value: 'APARCERIA', label: 'APARCERIA' }
];

const plazoOptions = [
  { value: 'MENSUAL', label: 'MENSUAL' },
  { value: 'TRIMESTRAL', label: 'TRIMESTRAL' },
  { value: 'SEMESTRAL', label: 'SEMESTRAL' },
  { value: 'ANUAL', label: 'ANUAL' }
];

const promedioOptions = [
  { value: 'ULTIMOS_5_DIAS', label: 'Últimos 5 días hábiles del mes anterior al pago' },
  { value: 'ULTIMOS_10_DIAS', label: 'Últimos 10 días hábiles del mes anterior al pago' },
  { value: 'MES_ANTERIOR', label: 'Mes anterior al pago' },
  { value: 'DEL_10_AL_15_MES_ACTUAL', label: 'Precios del día 10 al día 15 del mes actual al pago' }
];

const fuenteOptions = [
  { value: 'BCR', label: 'BCR' },
  { value: 'AGD', label: 'AGD' }
];

const arrendadoresDisponibles: Arrendador[] = [
  { id: '1', nombre: 'NORDESAN', hectareas: 0, quintales: 0 },
  { id: '2', nombre: 'AGRICOLA SA', hectareas: 0, quintales: 0 },
  { id: '3', nombre: 'CAMPO NUEVO', hectareas: 0, quintales: 0 }
];

//#####################################################
export default function CrearArrendamientoPage() {
  const [formData, setFormData] = useState({
    usuario: '',
    arrendatario: '',
    provincia: '',
    localidad: '',
    fechaInicio: '',
    fechaFin: '',
    hectareas: '',
    quintalesPorHectarea: '',
    plazoPago: 'MENSUAL',
    promedioPrecio: 'ULTIMOS_5_DIAS',
    fuentePrecio: 'BCR',
    descripcion: '',
    tipo: 'FIJO',
    porcentajeProduccion: 0
  });

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
  // Calcular totales
  const totalHectareas = participaciones.reduce((sum, p) => sum + (p.hectareas_asignadas || 0), 0);
  const totalQuintales = participaciones.reduce((sum, p) => sum + (p.quintales_asignados || 0), 0);



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: ["provincia", "localidad", "arrendatario", ].includes(field)
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

    setParticipaciones((prev) => [...prev, nuevoArrendador]);
    setNuevoArrendador({
      arrendador_id: 0,
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
  const guardarArrendamiento = () => {
    // Validaciones
      const newErrors: { [key: string]: string } = {};

      if (!formData.arrendatario) newErrors.arrendatario = "Campo obligatorio";
      if (!formData.provincia) newErrors.provincia = "Campo obligatorio";
      if (!formData.localidad) newErrors.localidad = "Campo obligatorio";
      if (!formData.fechaInicio) newErrors.fechaInicio = "Campo obligatorio";
      if (!formData.fechaFin) newErrors.fechaFin = "Campo obligatorio";
      if (!formData.hectareas) newErrors.hectareas = "Campo obligatorio";
      if (!formData.quintalesPorHectarea) newErrors.quintalesPorHectarea = "Campo obligatorio";
      if (!formData.porcentajeProduccion && formData.tipo == "APARCERIA") newErrors.porcentajeProduccion = "Campo obligatorio"
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        toast.error("Por favor, completa todos los campos obligatorios");
        return;
      }
    if (formData.tipo === 'FIJO') {
      const hectareasArrendamiento = parseFloat(formData.hectareas) || 0;
      if (Math.abs(totalHectareas - hectareasArrendamiento) > 0.01) {
        toast.error(`La suma de hectáreas de los arrendadores (${totalHectareas}) debe ser igual a las hectáreas del arrendamiento (${hectareasArrendamiento})`)
        return;
      }
    }

    if (participaciones.length === 0) {
      toast.error("Error al guardar el arrendamiento")      
      return;
    }

    // Aquí iría la lógica para guardar en el backend
    console.log('Guardando arrendamiento:', { formData, participaciones });
    alert('Arrendamiento guardado exitosamente');
    toast.success("Arrendamiento guardado con éxit  o")
  };

  useEffect(() => {   
    //Sesión
    const usuarioString = localStorage.getItem('user');
    if (usuarioString) {
      try {
        const usuario = JSON.parse(usuarioString);
        setNombreUsuario(`${usuario.nombre} ${usuario.apellido}`);
      } catch (error) {
        console.error('Error al parsear usuario desde localStorage', error);
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
        console.error('Error al cargar los arrendatarios', err);
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
        console.error('Error al cargar las provincias', err);
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
        console.log(options)
      }catch(err){
        console.error('Error al cargar los arrendadores', err);
      }
    };
    //Llamada funciones
    dataArrendatarios();
    dataProvincias();
    dataArrendadores();
  }, []);

  useEffect(() =>{
  const cargarLocalidades = async () => {
    if (!formData.provincia) {
      setLocalidades([]);
      setFormData((prev) => ({ ...prev, localidad: "" }));
      return;
    }

    try {
      const data = await fetchLocalidades(Number(formData.provincia));
      const options = data.map((l) => ({
        value: String(l.id),
        label: l.nombre_localidad,
      }));
      setLocalidades(options);
    } catch (err) {
      console.error("Error cargando localidades:", err);
      setLocalidades([]);
    }
  };
  //Se va a ejecutar cada vez que se cambie la provincia
  cargarLocalidades();
}, [formData.provincia]);

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
                  value={formData.arrendatario}
                  onChange={(val) => handleInputChange('arrendatario', val)}
                  label="Arrendatario"
                  error={errors.arrendatario}
                />
              </div>

              <div>
                <SelectFilter
                  options={provincias}
                  value={formData.provincia}
                  onChange={(val) => handleInputChange('provincia', val)}
                  label="Provincia"
                  error={errors.provincia}
                  />
              </div>

              <div>
                <SelectFilter
                  options={localidades}
                  value={formData.localidad}
                  onChange={(val) => handleInputChange('localidad', val)}
                  label="Localidad"
                  error={errors.localidad}
                />
              </div>

              <div>
                  <DateInput
                    label="Fecha Inicio"
                    value={formData.fechaInicio}
                    onChange={(val) => handleInputChange('fechaInicio', val)}
                    error={errors.fechaInicio}
                  />
              </div>
              
              <div>
                  <DateInput
                    label="Fecha Fin"
                    value={formData.fechaFin}
                    onChange={(val) => handleInputChange('fechaFin', val)}
                    error={errors.fechaFin}
                  />
              </div>
            </div>

            {/* Segunda fila de campos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <Input
                  value={formData.hectareas}
                  onChange={(e) => handleInputChange('hectareas', e)}
                  placeholder='Ej: 99.9'
                  label="Hectáreas del Campo"
                  error={errors.hectareas}
                />
              </div>

              <div>
                <Input
                  value={formData.quintalesPorHectarea}
                  onChange={(e) => handleInputChange('quintalesPorHectarea', e)}
                  placeholder='Ej: 99.9'
                  label="Quintales por Hectárea"
                  error={errors.quintalesPorHectarea}
                />
              </div>

              <div>
                <SelectFilter
                  options={plazoOptions}
                  value={formData.plazoPago}
                  onChange={(val) => handleInputChange('plazoPago', val)}
                  label="Plazo de Pago"
                />
              </div>

              <div>
                <SelectFilter
                  options={promedioOptions}
                  value={formData.promedioPrecio}
                  onChange={(val) => handleInputChange('promedioPrecio', val)}
                  label="Promedio Precio"
                />
              </div>

              <div>
                <SelectFilter
                  options={fuenteOptions}
                  value={formData.fuentePrecio}
                  onChange={(val) => handleInputChange('fuentePrecio', val)}
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

                {formData.tipo === 'APARCERIA' && (
                  <div>
                    <div className="flex items-center space-x-2">
                      <NumberInput
                        label="Porcentaje Producción"
                        value={formData.porcentajeProduccion}
                        min = {0}
                        max = {100}
                        onChange={(value) => handleNumberChange('porcentajeProduccion', value)}
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
                    <Input
                      value={String(nuevoArrendador.hectareas_asignadas)}
                      onChange={(e) => setNuevoArrendador({...nuevoArrendador, hectareas_asignadas: Number(e)})}
                      placeholder='Ej: 99.9'
                      label="Hectáreas para Arrendador"
                    />
                  </div>

                  <div>
                    <Input
                      value={String(nuevoArrendador.quintales_asignados)}
                      onChange={(e) => setNuevoArrendador({...nuevoArrendador, quintales_asignados: Number(e)})}
                      placeholder='Ej: 99.9'
                      label="Quintales por Hectárea para arrendador"
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

            {/* Tabla de arrendadores */}
            {participaciones.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Arrendador
                      </th>
                      {formData.tipo === 'FIJO' && (
                        <>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Hectáreas Asignadas
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Quintales por Hectárea
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participaciones.map((participacion) => (
                      <tr key={participacion.arrendador_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {participacion.arrendador_id}
                        </td>
                        {formData.tipo === 'FIJO' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {participacion.hectareas_asignadas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {participacion.quintales_asignados}
                            </td>
                          </>
                        )}
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
                    {formData.tipo === 'FIJO' && (
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-3 text-sm text-gray-900">
                          Total:
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-center">
                          {totalHectareas.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-center">
                          {totalQuintales.toFixed(1)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {participaciones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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