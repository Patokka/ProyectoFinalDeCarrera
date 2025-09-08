'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface CalendarProps {
  paymentDates?: Date[]
}

export default function Calendar({ paymentDates = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isExpanded, setIsExpanded] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const hasPayment = (date: Date) => {
    return paymentDates.some(paymentDate => 
      paymentDate.getDate() === date.getDate() &&
      paymentDate.getMonth() === date.getMonth() &&
      paymentDate.getFullYear() === date.getFullYear()
    )
  }

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

  return (
    <div className="card p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Calendario Mensual</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h4 className="text-base font-medium text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h4>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="h-8"></div>
            ))}
            
            {/* Month days */}
            {days.map((day) => {
              const isCurrentDay = isToday(day)
              const hasPaymentToday = hasPayment(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    h-8 flex flex-col items-center justify-center text-sm relative
                    ${isCurrentDay ? 'bg-primary-100 text-primary-700 font-semibold rounded' : 'text-gray-700'}
                    ${!isSameMonth(day, currentDate) ? 'text-gray-300' : ''}
                    hover:bg-gray-100 cursor-pointer rounded
                  `}
                >
                  <span>{day.getDate()}</span>
                  {hasPaymentToday && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute bottom-0.5"></div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}