'use client'

import { useState, useEffect } from 'react'
import Calendar from '../ui/Calendar'
import PaymentSummary from '../ui/PaymentSummary'
import { useAuth } from '@/components/context/AuthContext'
import Link from 'next/link'

export default function SideBar({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  
    useEffect(() => {
      setMounted(true)
    }, [])

  if (!mounted || !user) return <>{children}</> // No renderiza sidebar si no hay sesión

  return (
    <div className="relative min-h-screen left-4 bg-gray-50">
      <button onClick={() => setSidebarVisible(!sidebarVisible)} className="fixed top-24 z-20 btn-secondary text-sm p-2 rounded-r-md bg-green-300 shadow-md">
        {sidebarVisible ? '‹' : '›'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {sidebarVisible && (
          <div className="lg:col-span-1 space-y-4 p-4 bg-slate-200 border-r border-gray-400 transition-all duration-300">
            <Calendar/>
            <PaymentSummary/>
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
  )
}
