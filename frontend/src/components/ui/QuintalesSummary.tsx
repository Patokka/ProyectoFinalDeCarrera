'use client'

import { useState, useEffect } from 'react'
import { Leaf, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchNextMonthQuintalesSummary } from '@/lib/pagos/auth' 
import { QuintalesSummaryResponse } from '@/lib/type'
import { formatQuintales } from '@/lib/helpers'

/**
 * @component QuintalesSummary
 * @description Un componente de tarjeta que muestra un resumen de los quintales a pagar
 *              en el próximo mes, agrupados por arrendatario. Es expandible y colapsable.
 * @returns {JSX.Element} El componente de resumen de quintales.
 */
export default function QuintalesSummary() {
    const [summary, setSummary] = useState<QuintalesSummaryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [isExpanded, setIsExpanded] = useState(true)
    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const month = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const year = nextMonthDate.getFullYear();

    /**
     * @effect
     * @description Carga el resumen de quintales desde la API al montar el componente.
     */
    useEffect(() => {
        async function loadSummary() {
        try {
            const data = await fetchNextMonthQuintalesSummary()
            setSummary(data)
        } catch (error) {
            console.error('Error al cargar el resumen de cosecha:', error)
            setSummary([])
        } finally {
            setLoading(false)
        }
        }
        loadSummary()
    }, [])
    const grandTotalQuintales = summary.reduce((sum, item) => sum + item.quintales, 0)

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
                <Leaf className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quintales a Pagar {month}/{year}</h3>
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
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4">
                {summary.length > 0 && (
                    <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Resumen por arrendatario:
                    </p>
                    </div>
                )}
                <div className="space-y-3">
                    {summary.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    • {item.arrendatario} ({item.cantidad} pago/s): 
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                                {formatQuintales(item.quintales)}
                            </span>
                        </div>
                    ))}
                </div>
                {summary.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-gray-900">Total a pagar:</span>
                            <span className="text-lg font-bold text-primary-600">
                                {formatQuintales(grandTotalQuintales)}
                            </span>
                        </div>
                    </div>
                )}
                {summary.length === 0 && (
                    <div className="text-center py-4">
                        <Leaf className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No quintales a pagar en {month}/{year}</p>
                    </div>
                )}
            </div>
        </div>
        {/* Vista contraída - solo muestra el total */}
        {!isExpanded && (
            <div className="p-4">
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">
                        Total quintales a pagar
                    </p>
                    <p className="text-lg font-bold text-primary-600">
                        {formatQuintales(grandTotalQuintales)}
                    </p>
                </div>
            </div>
        )}
    </div>
    )
}