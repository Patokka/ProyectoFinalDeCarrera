'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SelectFilter from '@/components/ui/SelectFilter';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// Tipos de datos
interface Arrendador {
  id: number;
  nombre_o_razon_social: string;
  cuil: string;
  condicion_fiscal: 'MONOTRIBUTISTA' | 'RESPONSABLE_INSCRIPTO' | 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO';
  mail: string;
  telefono: string;
  localidad: {
    id: number;
    nombre_localidad: string;
    provincia: {
      id: number;
      nombre_provincia: string;
    };
  };
}

// Datos de ejemplo basados en tu mockup
const arrendadoresData: Arrendador[] = [
  {
    id: 1,
    nombre_o_razon_social: 'PATRICIO GAGGIOTTI BUSSI',
    cuil: '20-44307268-4',
    condicion_fiscal: 'MONOTRIBUTISTA',
    mail: 'patogaggiotti@gmail.com',
    telefono: '3491417079',
    localidad: {
      id: 1,
      nombre_localidad: 'CERES',
      provincia: {
        id: 1,
        nombre_provincia: 'SANTA FE'
      }
    }
  },
  {
    id: 2,
    nombre_o_razon_social: 'PATRICIO GAGGIOTTI BUSSI',
    cuil: '20-44307268-4',
    condicion_fiscal: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO',
    mail: 'patogaggiotti@gmail.com',
    telefono: '3491417079',
    localidad: {
      id: 2,
      nombre_localidad: 'SANTA FE',
      provincia: {
        id: 1,
        nombre_provincia: 'SANTA FE'
      }
    }
  },
  {
    id: 3,
    nombre_o_razon_social: 'IVAN GAGGIOTTI',
    cuil: '20-21620263-6',
    condicion_fiscal: 'RESPONSABLE_INSCRIPTO',
    mail: 'ivancho@gmail.com',
    telefono: '3491417079',
    localidad: {
      id: 1,
      nombre_localidad: 'CERES',
      provincia: {
        id: 1,
        nombre_provincia: 'SANTA FE'
      }
    }
  },
  {
    id: 4,
    nombre_o_razon_social: 'PATRICIO GAGGIOTTI BUSSI',
    cuil: '20-44307268-4',
    condicion_fiscal: 'MONOTRIBUTISTA',
    mail: 'patogaggiotti@gmail.com',
    telefono: '3491417079',
    localidad: {
      id: 1,
      nombre_localidad: 'CERES',
      provincia: {
        id: 1,
        nombre_provincia: 'SANTA FE'
      }
    }
  },
  {
    id: 5,
    nombre_o_razon_social: 'EJEMPLO',
    cuil: '99-9999999-9',
    condicion_fiscal: 'MONOTRIBUTISTA',
    mail: 'patogaggiotti@gmail.com',
    telefono: '3491417079',
    localidad: {
      id: 1,
      nombre_localidad: 'CERES',
      provincia: {
        id: 1,
        nombre_provincia: 'SANTA FE'
      }
    }
  }
];

// Opciones para los filtros
const condicionFiscalOptions = [
  { value: '', label: 'Todas las condiciones' },
  { value: 'MONOTRIBUTISTA', label: 'MONOTRIBUTISTA' },
  { value: 'RESPONSABLE_INSCRIPTO', label: 'RESPONSABLE INSCRIPTO' },
  { value: 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO', label: 'RESPONSABLE NO INSCRIPTO' }
];

const ITEMS_PER_PAGE = 8;

export default function ArrendadoresPage() {
  const [arrendadores, setArrendadores] = useState<Arrendador[]>(arrendadoresData);
  const [searchTermNombre, setSearchTermNombre] = useState('');
  const [searchTermCuit, setSearchTermCuit] = useState('');
  const [condicionFilter, setCondicionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return arrendadores.filter(item => {
      const matchesNombre = item.nombre_o_razon_social
        .toLowerCase()
        .includes(searchTermNombre.toLowerCase());
      const matchesCuit = item.cuil
        .toLowerCase()
        .includes(searchTermCuit.toLowerCase());
      const matchesCondicion = !condicionFilter || item.condicion_fiscal === condicionFilter;
      
      return matchesNombre && matchesCuit && matchesCondicion;
    });
  }, [arrendadores, searchTermNombre, searchTermCuit, condicionFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTermNombre, searchTermCuit, condicionFilter]);

  const getCondicionBadgeColor = (condicion: string) => {
    switch (condicion) {
      case 'MONOTRIBUTISTA':
        return 'bg-green-100 text-green-800';
      case 'RESPONSABLE_INSCRIPTO':
        return 'bg-blue-100 text-blue-800';
      case 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este arrendador?')) {
      setArrendadores(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Arrendadores</h1>
              </div>
              <Link href="/arrendadores/nuevo" passHref>
                <button className="btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Arrendador</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-slate-100 rounded-lg shadow-sm border border-gray-400 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3 underline">Filtrar:</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput
                placeholder="ej: Patricio"
                value={searchTermNombre}
                onChange={setSearchTermNombre}
                label="Nombre"
              />
              <SearchInput
                placeholder="ej: 999999999"
                value={searchTermCuit}
                onChange={setSearchTermCuit}
                label="CUIT-CUIL"
              />
              <SelectFilter
                options={condicionFiscalOptions}
                value={condicionFilter}
                onChange={setCondicionFilter}
                placeholder="ej: MONOTRIBUTISTA"
                label="Condición Fiscal"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CUIT-CUIL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Condición Fiscal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Localidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((arrendador) => (
                    <tr key={arrendador.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                        <div className="truncate" title={arrendador.nombre_o_razon_social}>
                          {arrendador.nombre_o_razon_social}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {arrendador.cuil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCondicionBadgeColor(arrendador.condicion_fiscal)}`}>
                          {arrendador.condicion_fiscal.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={arrendador.mail}>
                          {arrendador.mail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {arrendador.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {arrendador.localidad.nombre_localidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(arrendador.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mensaje cuando no hay datos */}
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron arrendadores que coincidan con los filtros.</p>
              </div>
            )}
          </div>

          {/* Paginación y botón volver */}
          <div className="mt-6 flex justify-between">
            <Link href="/dashboard" passHref>
              <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                Volver
              </button>
            </Link>
            {totalPages > 1 && (
              <div className="flex-1 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}