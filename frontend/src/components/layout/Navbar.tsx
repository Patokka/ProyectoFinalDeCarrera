'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  Users, 
  Building2, 
  CreditCard, 
  Receipt, 
  Percent, 
  TrendingUp, 
  BarChart3, 
  User,
  LogOut
} from 'lucide-react'

const navigationItems = [
  { name: 'Arrendamientos', href: '/arrendamientos', icon: FileText },
  { name: 'Arrendadores', href: '/arrendadores', icon: Users },
  { name: 'Arrendatarios', href: '/arrendatarios', icon: Building2 },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Facturaciones', href: '/facturaciones', icon: Receipt },
  { name: 'Retenciones', href: '/retenciones', icon: Percent },
  { name: 'Precios', href: '/precios', icon: TrendingUp },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Usuarios', href: '/usuarios', icon: User },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SA</span>
              </div>
              <span className="hidden sm:block text-xl font-semibold text-gray-900">
                Sistema Arrendamientos
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link flex items-center space-x-1 ${
                    isActive ? 'nav-link-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Usuario: Ejemplo</span>
            <button className="btn-secondary flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}