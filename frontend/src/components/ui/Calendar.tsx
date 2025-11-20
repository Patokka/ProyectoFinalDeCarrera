'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { fetchPaymentDates } from '@/lib/pagos/auth'
import { PagoDia } from '@/lib/type'
import { getPagoBadgeColorCalendar } from "@/lib/helpers";

interface CalendarProps {}

/**
 * @component Calendar
 * @description Un componente de calendario mensual que muestra los días con pagos
 *              pendientes, vencidos o realizados, resaltados con diferentes colores.
 *              Es expandible y colapsable.
 * @returns {JSX.Element} El componente del calendario.
 */
export default function Calendar({}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [paymentDates, setPaymentDates] = useState<PagoDia[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const PRIORITY = ["VENCIDO", "PENDIENTE", "REALIZADO", "CANCELADO"]

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
    const estadosEnDia = paymentDates
      .filter(p => p.fecha === dayStr) 
      .map(p => p.estado)

    return getHighestPriority(estadosEnDia)
  }
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
  
  /**
   * @effect
   * @description Carga los datos de los pagos para el mes actual cada vez que `currentDate` cambia.
   */
  useEffect(() => {
    loadPayments()
  }, [currentDate])

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  return (
    <div className="card w-full max-w-sm mx-auto">
      {/* Header expandible */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Calendario Mensual</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label={isExpanded ? 'Contraer calendario' : 'Expandir calendario'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      {/* Contenido expandible */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h4 className="text-base font-medium text-gray-900 capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</h4>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="h-8"></div>
            ))}

            {days.map((day) => {
              const isCurrentDay = isToday(day)
              const status = getDayStatus(day)
              const colorClass = status ? getPagoBadgeColorCalendar(status) : ""

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    h-8 flex flex-col items-center justify-center text-sm relative rounded cursor-pointer
                    transition-colors duration-200
                    ${isCurrentDay ? "bg-primary-100 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-100"}
                    ${!isSameMonth(day, currentDate) ? "text-gray-300" : ""}
                  `}
                >
                  <span>{day.getDate()}</span>
                  {status && (
                    <div
                      className={`w-full h-1 absolute bottom-0 left-0 rounded-b ${colorClass}`}
                    ></div>
                  )}
                </div>
              )
            })}
          </div>

          {loading && <div className="mt-2 text-center text-sm text-gray-500">Cargando pagos...</div>}
        </div>
      </div>

      {/* Vista contraída */}
      {!isExpanded && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</p>
          <p className="text-xs text-gray-500 mt-1">{paymentDates.length > 0 ? `${paymentDates.length} pagos este mes` : 'Sin pagos'}</p>
        </div>
      )}
    </div>
  )
}
