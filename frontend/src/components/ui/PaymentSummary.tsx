'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchPaymentSummary } from '@/lib/pagos/auth'
import { PaymentSummaryResponse } from '@/lib/type'

export default function PaymentSummary() {
  const [payments, setPayments] = useState<PaymentSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const today = new Date();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const month = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
  const year = nextMonthDate.getFullYear();

  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await fetchPaymentSummary()
        setPayments(data)
      } catch (error) {
        console.error(error)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
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
      <div className="card w-full max-w-sm">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card w-full max-w-sm mx-auto">
      {/* Header expandible */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pagos del Mes {month}/{year}</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label={isExpanded ? 'Contraer resumen' : 'Expandir resumen'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Contenido expandible */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Este mes debe realizar <span className="font-semibold text-primary-600">{totalPagos} pago/s</span>:
            </p>
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    • {payment.cantidad} pago/s con {payment.arrendatario}
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
      </div>

      {/* Vista contraída - solo muestra totales */}
      {!isExpanded && (
        <div className="p-4">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              {totalPagos} pago/s pendientes
            </p>
            <p className="text-lg font-bold text-primary-600">
              {formatCurrency(totalMonto)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}