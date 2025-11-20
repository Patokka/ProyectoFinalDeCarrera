'use client'

import { useState, useEffect } from 'react'
import Calendar from '../ui/Calendar'
import PaymentSummary from '../ui/PaymentSummary'
import { useAuth } from '@/components/context/AuthContext'
import Link from 'next/link'
import QuintalesSummary from '../ui/QuintalesSummary'
import ProtectedRoute from './ProtectedRoute'

/**
 * @component SideBar
 * @description Un panel lateral que contiene componentes de resumen como el calendario
 *              de pagos, un resumen de pagos del mes y un resumen de quintales.
 *              Puede ser colapsado por el usuario.
 * @param {object} props - Propiedades del componente.
 * @param {ReactNode} props.children - El contenido principal de la página que se mostrará
 *                                     junto a la barra lateral.
 * @returns {JSX.Element} El componente de la barra lateral y el contenido principal.
 */
export default function SideBar({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  /**
   * @effect
   * @description Asegura que el componente se renderice solo en el cliente
   *              para evitar problemas de hidratación con `localStorage`.
   */
    useEffect(() => {
      setMounted(true)
    }, [])

  if (!mounted || !user) return <>{children}</> // No renderiza sidebar si no hay sesión

  return (
    <ProtectedRoute>
      <div className="relative left-4 bg-gray-50">
        <button onClick={() => setSidebarVisible(!sidebarVisible)} className="fixed top-24 z-20 btn-secondary text-sm p-2 rounded-r-md bg-green-300 shadow-md">
          {sidebarVisible ? '‹' : '›'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {sidebarVisible && (
            <div className="lg:col-span-1 space-y-4 p-4 bg-slate-200 border-r border-gray-400 transition-all duration-300 sticky top-16 overflow-y-auto h-[calc(100vh-4rem)]">
              <Calendar/>
              <PaymentSummary/>
              <QuintalesSummary/>
              <div className="card p-4">
                <Link href="/pagos" passHref>
                  <button className="w-full btn-primary text-sm">
                    Ir a pestaña de pagos
                  </button>
                </Link>
              </div>
            </div>
          )}

          <div className={`transition-all duration-300 ${sidebarVisible ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
