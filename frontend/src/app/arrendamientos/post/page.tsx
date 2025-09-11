'use client';

import { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';

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
  { value: 'MES_ANTERIOR', label: 'Mes anterior al pago' }
];

const fuenteOptions = [
  { value: 'BCR', label: 'BCR' },
  { value: 'MATBA', label: 'MATBA' },
  { value: 'OTRO', label: 'OTRO' }
];

const provinciaOptions = [
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Buenos Aires', label: 'Buenos Aires' },
  { value: 'Córdoba', label: 'Córdoba' }
];

const localidadOptions = [
  { value: 'Ceres', label: 'Ceres' },
  { value: 'Rosario', label: 'Rosario' },
  { value: 'Santa Fe', label: 'Santa Fe' }
];

const arrendatarioOptions = [
  { value: 'NORDESAN', label: 'NORDESAN' },
  { value: 'AGRICOLA_SA', label: 'AGRICOLA SA' },
  { value: 'CAMPO_NUEVO', label: 'CAMPO NUEVO' }
];

export default function CrearArrendamientoPage() {
  const [formData, setFormData] = useState({
    usuario: '',
    arrendatario: '',
    provincia: 'Santa Fe',
    localidad: 'Ceres',
    fechaInicio: '',
    fechaFin: '',
    hectareas: '',
    quintalesPorHectarea: '',
    plazoPago: 'MENSUAL',
    promedioPrecio: 'ULTIMOS_5_DIAS',
    fuentePrecio: 'BCR',
    descripcion: '',
    tipo: 'FIJO',
    porcentajeProduccion: 5
  });

  const [arrendadores, setArrendadores] = useState<Arrendador[]>([]);
  const [nuevoArrendador, setNuevoArrendador] = useState({
    nombre: '',
    hectareas: '',
    quintales: ''
  });

  // Calcular totales
  const totalHectareas = arrendadores.reduce((sum, a) => sum + a.hectareas, 0);
  const totalQuintales = arrendadores.reduce((sum, a) => sum + a.quintales, 0);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const agregarArrendador = () => {
    if (nuevoArrendador.nombre && nuevoArrendador.hectareas) {
      const newArrendador: Arrendador = {
        id: Date.now().toString(),
        nombre: nuevoArrendador.nombre,
        hectareas: parseFloat(nuevoArrendador.hectareas) || 0,
        quintales: parseFloat(nuevoArrendador.quintales) || 0
      };
      setArrendadores([...arrendadores, newArrendador]);
      setNuevoArrendador({ nombre: '', hectareas: '', quintales: '' });
    }
  };

  const eliminarArrendador = (id: string) => {
    setArrendadores(arrendadores.filter(a => a.id !== id));
  };

  const guardarArrendamiento = () => {
    // Validaciones
    if (formData.tipo === 'FIJO') {
      const hectareasArrendamiento = parseFloat(formData.hectareas) || 0;
      if (Math.abs(totalHectareas - hectareasArrendamiento) > 0.01) {
        alert(`La suma de hectáreas de los arrendadores (${totalHectareas}) debe ser igual a las hectáreas del arrendamiento (${hectareasArrendamiento})`);
        return;
      }
    }

    if (arrendadores.length === 0) {
      alert('El arrendamiento debe contar con al menos un arrendador.');
      return;
    }

    // Aquí iría la lógica para guardar en el backend
    console.log('Guardando arrendamiento:', { formData, arrendadores });
    alert('Arrendamiento guardado exitosamente');
  };

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
                  value={formData.usuario}
                  onChange={(e) => handleInputChange('usuario', e.target.value)}
                  placeholder="Ejemplo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrendatario:</label>
                <select
                  value={formData.arrendatario}
                  onChange={(e) => handleInputChange('arrendatario', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Ej: NORDESAN</option>
                  {arrendatarioOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia:</label>
                <select
                  value={formData.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {provinciaOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad:</label>
                <select
                  value={formData.localidad}
                  onChange={(e) => handleInputChange('localidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {localidadOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                    placeholder="DD MM AAAA"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                    placeholder="DD MM AAAA"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Segunda fila de campos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hectáreas:</label>
                <input
                  type="text"
                  value={formData.hectareas}
                  onChange={(e) => handleInputChange('hectareas', e.target.value)}
                  placeholder="Ej: 99.9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quintales por Hectárea:</label>
                <input
                  type="text"
                  value={formData.quintalesPorHectarea}
                  onChange={(e) => handleInputChange('quintalesPorHectarea', e.target.value)}
                  placeholder="Ej: 99.9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de Pago:</label>
                <select
                  value={formData.plazoPago}
                  onChange={(e) => handleInputChange('plazoPago', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {plazoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promedio Precio:</label>
                <select
                  value={formData.promedioPrecio}
                  onChange={(e) => handleInputChange('promedioPrecio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500  text-xs"
                >
                  {promedioOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuente Precio:</label>
                <select
                  value={formData.fuentePrecio}
                  onChange={(e) => handleInputChange('fuentePrecio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {fuenteOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tercera fila - Descripción y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Ej: Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo:</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {tipoOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {formData.tipo === 'APARCERIA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje Producción:</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleInputChange('porcentajeProduccion', Math.max(0, formData.porcentajeProduccion - 0.5))}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        value={formData.porcentajeProduccion}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (!isNaN(parseFloat(val))) {
                            handleInputChange('porcentajeProduccion', parseFloat(val));
                          }
                        }}
                        className="w-20 text-center px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <button
                        onClick={() => handleInputChange('porcentajeProduccion', formData.porcentajeProduccion + 0.5)}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        +
                      </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Razón Social:</label>
                <input
                  type="text"
                  value={nuevoArrendador.nombre}
                  onChange={(e) => setNuevoArrendador({...nuevoArrendador, nombre: e.target.value})}
                  placeholder="Ej: Patricio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {formData.tipo === 'FIJO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hectáreas del arrendamiento:</label>
                    <input
                      type="text"
                      value={nuevoArrendador.hectareas}
                      onChange={(e) => setNuevoArrendador({...nuevoArrendador, hectareas: e.target.value})}
                      placeholder="Ej: 99.9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quintales por Hectárea:</label>
                    <input
                      type="text"
                      value={nuevoArrendador.quintales}
                      onChange={(e) => setNuevoArrendador({...nuevoArrendador, quintales: e.target.value})}
                      placeholder="Ej: 99.9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            {arrendadores.length > 0 && (
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
                    {arrendadores.map((arrendador) => (
                      <tr key={arrendador.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {arrendador.nombre}
                        </td>
                        {formData.tipo === 'FIJO' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {arrendador.hectareas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {arrendador.quintales}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => eliminarArrendador(arrendador.id)}
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
                          {totalHectareas.toFixed(1)}
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

            {arrendadores.length === 0 && (
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