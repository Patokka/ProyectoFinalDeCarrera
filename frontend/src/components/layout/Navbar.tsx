'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User, LogOut, Menu, X, FileText, Users, Building2, CreditCard, Receipt, Percent, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '@/components/context/AuthContext'

const navigationItems = [
  { name: 'Arrendamientos', href: '/arrendamientos', icon: FileText },
  { name: 'Arrendadores', href: '/arrendadores', icon: Users },
  { name: 'Arrendatarios', href: '/arrendatarios', icon: Building2 },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Facturaciones', href: '/facturaciones', icon: Receipt },
  { name: 'Retenciones', href: '/retenciones', icon: Percent },
  { name: 'Precios', href: '/precios', icon: TrendingUp },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Usuarios', href: '/usuarios', icon: User},
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user) return null // No renderiza si no hay sesión

  {/*            <img
              src="/logo2.png"
              alt="Avatar"
              className="w-10 h-10 rounded-lg object-cover"
            />/*/}
  return (
    <nav className="bg-slate-50 shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-20 h-10 bg-white rounded-lg flex items-center justify-center">
              <img
              src="/logo2.png"
              alt="Avatar"
              className="w-10 h-10 rounded-lg object-cover"
            />
            </div>
            <span className="hidden sm:block text-xl font-semibold text-gray-900">
              Sistema Arrendamientos
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navigationItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} className={`flex items-center space-x-1 px-3 py-2 rounded-md ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:block text-sm">{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-1 bg-gray-300 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">{user.nombre} {user.apellido}</span>
            </div>
            <button onClick={logout} className="btn-secondary flex items-center space-x-2 text-sm hover:bg-red-500">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            {navigationItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-md ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <button onClick={logout} className="flex items-center space-x-3 px-3 py-2 w-full text-left text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md">
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>  
  )
}
