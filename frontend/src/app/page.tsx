'use client'

import { useState, useEffect } from 'react'
import Calendar from '@/components/home/Calendar'
import PaymentSummary from '@/components/home/PaymentSummary'
import QuickActions from '@/components/home/QuickActions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function HomePage() {
  const [paymentDates, setPaymentDates] = useState<Date[]>([])
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es })

  // Simular fechas con pagos - en producción vendrían de la API
  useEffect(() => {
    const mockPaymentDates = [
      new Date(2024, 0, 15), // 15 de enero
      new Date(2024, 0, 22), // 22 de enero
      new Date(2024, 0, 28), // 28 de enero
    ]
    setPaymentDates(mockPaymentDates)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Bienvenido al Sistema
            <br />
            de Gestión de
            <br />
            Arrendamientos!
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar izquierdo */}
          <div className="lg:col-span-1 space-y-6">
            <Calendar paymentDates={paymentDates} />
            <PaymentSummary currentMonth={currentMonth} />
            
            {/* Botón adicional */}
            <div className="card p-4">
              <button className="w-full btn-primary text-sm">
                Ir a pestaña de facturación
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-center min-h-[500px]">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}