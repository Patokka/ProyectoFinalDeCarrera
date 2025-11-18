'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User, LogOut, Menu, X, FileText, Users, Building2, CreditCard, Receipt, Percent, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '@/components/context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

/**
 * @constant navigationItems
 * @description Array de objetos que define los elementos de navegación principal.
 *              Cada objeto contiene el nombre, la ruta y el ícono.
 */
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

/**
 * @component Navbar
 * @description La barra de navegación superior de la aplicación. Es responsive,
 *              muestra los enlaces de navegación, el nombre del usuario y el botón de cierre de sesión.
 *              Filtra los enlaces visibles según el rol del usuario.
 * @returns {JSX.Element | null} El componente de la barra de navegación o `null` si no hay sesión.
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  /**
   * @effect
   * @description Evita problemas de hidratación asegurando que el componente se renderice
   *              solo en el lado del cliente después del montaje.
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user) return null;

  return (
    <ProtectedRoute>
      <nav className="bg-slate-50 shadow-lg border-b fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
                <img src="/logo2.png" alt="Logo" className="w-10 h-10 rounded-lg object-cover"/>
              <span className="hidden sm:block text-xl font-semibold">Sistema Arrendamientos</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
              {navigationItems
                .filter(item => !(item.name === 'Usuarios' && user.rol !== 'ADMINISTRADOR') && !(item.name === 'Reportes' && user.rol === 'CONSULTA'))
                .map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.name} href={item.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                      <Icon className="w-4 h-4" />
                      <span className="hidden xl:block text-sm">{item.name}</span>
                    </Link>
                  )
              })}
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <Link href={`/usuarios/${user.id}`}>
                <div className="user-pill">
                  <User size={16} />
                  <span>{user.nombre} {user.apellido}</span>
                </div>
              </Link>
              <button onClick={logout} className="btn-secondary flex items-center space-x-2 text-sm hover:bg-red-500">
                <LogOut size={16} /><span>Cerrar Sesión</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            {navigationItems
              .filter(item => !(item.name === 'Usuarios' && user.rol !== 'ADMINISTRADOR'))
              .map(item => (
                <Link key={item.name} href={item.href} className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="w-5 h-5" /><span>{item.name}</span>
                </Link>
              ))}
            <div className="border-t pt-3 mt-3">
              <Link href={`/usuarios/${user.id}`} className="mobile-user-link">
                  <User /><span>{user.nombre} {user.apellido}</span>
              </Link>
              <button onClick={logout} className="mobile-logout-button">
                <LogOut /><span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </ProtectedRoute>
  )
}
