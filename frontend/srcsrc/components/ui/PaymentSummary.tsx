'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchPaymentSummary } from '@/lib/pagos/auth'
import { PaymentSummaryResponse } from '@/lib/type'
import { formatCurrency } from '@/lib/helpers'

/**
 * @component PaymentSummary
 * @description Un componente de tarjeta que muestra un resumen de los pagos pendientes
 *              para el mes actual, agrupados por arrendatario. Es expandible y colapsable.
 * @returns {JSX.Element} El componente de resumen de pagos.
 */
export default function PaymentSummary() {
  const [payments, setPayments] = useState<PaymentSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  /**
   * @effect
   * @description Carga el resumen de pagos desde la API al montar el componente.
   */
  useEffect(() => {
    async function loadPayments() {
      try {
        setPayments(await fetchPaymentSummary());
      } catch (error) {
        console.error(error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadPayments()
  }, [])

  const totalPagos = payments.reduce((sum, item) => sum + item.cantidad, 0)
  const totalMonto = payments.reduce((sum, item) => sum + item.monto, 0)

  if (loading) {
    return (
      <div className="card w-full max-w-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-3 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Pagos del Mes ({month}/{year})</h3>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="btn-icon-gray">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Este mes debe realizar <span className="font-semibold text-primary-600">{totalPagos} pago(s)</span>:</p>
          <div className="space-y-3">
            {payments.map((p, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="text-sm font-medium">• {p.cantidad} pago(s) con {p.arrendatario}</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(p.monto)}</span>
              </div>
            ))}
          </div>
          {payments.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(totalMonto)}</span>
              </div>
            </div>
          )}
          {payments.length === 0 && (
            <div className="text-center py-4">
              <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay pagos programados para este mes.</p>
            </div>
          )}
        </div>
      </div>

      {!isExpanded && (
        <div className="p-4 text-center">
          <p className="text-sm font-semibold">{totalPagos} pago(s) pendientes</p>
          <p className="text-lg font-bold text-primary-600">{formatCurrency(totalMonto)}</p>
        </div>
      )}
    </div>
  )
}
