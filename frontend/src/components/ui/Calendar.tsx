'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { fetchPaymentDates } from '@/lib/pagos/auth'
import { PagoDia } from '@/lib/type'
import { getPagoBadgeColorCalendar } from "@/lib/helpers";

/**
 * @component Calendar
 * @description Un componente de calendario mensual que muestra los días con pagos
 *              pendientes, vencidos o realizados, resaltados con diferentes colores.
 *              Es expandible y colapsable.
 * @returns {JSX.Element} El componente del calendario.
 */
export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [paymentDates, setPaymentDates] = useState<PagoDia[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const PRIORITY = ["VENCIDO", "PENDIENTE", "REALIZADO"]

  /**
   * @function getHighestPriority
   * @description Determina el estado de mayor prioridad para un día si hay múltiples pagos.
   * @param {string[]} diaEstados - Array de estados de pago para un día.
   * @returns {string | null} El estado de mayor prioridad.
   */
  function getHighestPriority(diaEstados: string[]) {
    for (const p of PRIORITY) {
      if (diaEstados.includes(p)) return p
    }
    return null
  }

  /**
   * @function getDayStatus
   * @description Obtiene el estado de mayor prioridad para una fecha específica.
   * @param {Date} date - La fecha a consultar.
   * @returns {string | null} El estado del día.
   */
  const getDayStatus = (date: Date) => {
    const dayStr = format(date, "yyyy-MM-dd")
    const estadosEnDia = paymentDates.filter(p => p.fecha === dayStr).map(p => p.estado)
    return getHighestPriority(estadosEnDia)
  }

  /**
   * @effect
   * @description Carga los datos de los pagos para el mes actual cada vez que `currentDate` cambia.
   */
  useEffect(() => {
    const loadPayments = async () => {
        setLoading(true)
        try {
          const month = currentDate.getMonth() + 1
          const year = currentDate.getFullYear()
          const dates = await fetchPaymentDates(month, year)
          setPaymentDates(dates)
        } catch (error) {
          setPaymentDates([])
        } finally {
          setLoading(false)
        }
      }
    loadPayments()
  }, [currentDate])

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  return (
    <div className="card w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold">Calendario Mensual</h3>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="btn-icon-gray">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="btn-icon-gray"><ChevronLeft size={16} /></button>
            <h4 className="text-base font-medium capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</h4>
            <button onClick={nextMonth} className="btn-icon-gray"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const status = getDayStatus(day);
              return (
                <div key={day.toISOString()} className={`day-cell ${isToday(day) ? 'today' : ''} ${!isSameMonth(day, currentDate) ? 'not-in-month' : ''}`}>
                  <span>{day.getDate()}</span>
                  {status && <div className={`status-indicator ${getPagoBadgeColorCalendar(status)}`} />}
                </div>
              )
            })}
          </div>
          {loading && <div className="mt-2 text-center text-sm text-gray-500">Cargando...</div>}
        </div>
      </div>

      {!isExpanded && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</p>
          <p className="text-xs text-gray-500 mt-1">{paymentDates.length > 0 ? `${paymentDates.length} pagos` : 'Sin pagos'}</p>
        </div>
      )}
    </div>
  )
}
