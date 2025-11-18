'use client'

import Link from 'next/link'
import {
  FileText,
  Users,
  Building2,
  Receipt,
  Percent,
  CreditCard
} from 'lucide-react'

/**
 * @constant quickActions
 * @description Array de objetos que define las tarjetas de "Acciones Rápidas" en el dashboard.
 *              Cada objeto representa una sección principal de la aplicación.
 */
const quickActions = [
  {
    title: 'Arrendamientos',
    description: 'Gestionar contratos de arrendamiento',
    href: '/arrendamientos',
    icon: FileText,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'Arrendadores',
    description: 'Administrar propietarios',
    href: '/arrendadores',
    icon: Users,
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Arrendatarios',
    description: 'Gestionar empresas productoras',
    href: '/arrendatarios',
    icon: Building2,
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    title: 'Facturaciones',
    description: 'Procesar facturas',
    href: '/facturaciones',
    icon: Receipt,
    color: 'bg-orange-500 hover:bg-orange-600'
  },
    {
    title: 'Pagos',
    description: 'Administrar pagos',
    href: '/pagos',
    icon: CreditCard,
    color: 'bg-yellow-500 hover:bg-yellow-600'
  },
    {
    title: 'Retenciones',
    description: 'Gestionar Retenciones',
    href: '/retenciones',
    icon: Percent,
    color: 'bg-red-500 hover:bg-red-600'
  }
]

/**
 * @component QuickActions
 * @description Un componente que muestra una grilla de tarjetas de acceso rápido
 *              a las principales secciones de la aplicación.
 * @returns {JSX.Element} El componente de acciones rápidas.
 */
export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {quickActions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.title} href={action.href} className="group">
            <div className="card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-lg ${action.color} flex items-center justify-center transition-colors duration-200`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
