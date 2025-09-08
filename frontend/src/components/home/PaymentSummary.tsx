'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign } from 'lucide-react'

interface PaymentSummaryItem {
  arrendatario: string
  cantidad: number
  monto: number
}

interface PaymentSummaryProps {
  currentMonth?: string
}

export default function PaymentSummary({ currentMonth }: PaymentSummaryProps) {
  const [payments, setPayments] = useState<PaymentSummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Datos de ejemplo - en producción vendrían de la API
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setPayments([
        { arrendatario: 'Arrendatario1', cantidad: 3, monto: 150000 },
        { arrendatario: 'Arrendatario2', cantidad: 2, monto: 85000 },
        { arrendatario: 'Arrendatario3', cantidad: 1, monto: 45000 },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const totalPagos = payments.reduce((sum, item) => sum + item.cantidad, 0)
  const totalMonto = payments.reduce((sum, item) => sum + item.monto, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="card p-4 w-full max-w-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 w-full max-w-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Este mes debe realizar {totalPagos} pagos:
        </h3>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                • {payment.cantidad} pagos con {payment.arrendatario}
              </span>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(payment.monto)}
            </span>
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">Total:</span>
            <span className="text-lg font-bold text-primary-600">
              {formatCurrency(totalMonto)}
            </span>
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div className="text-center py-4">
          <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay pagos programados para este mes</p>
        </div>
      )}
    </div>
  )
}