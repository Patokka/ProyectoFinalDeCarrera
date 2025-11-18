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
                setSummary(await fetchNextMonthQuintalesSummary());
            } catch (error) {
                console.error('Error al cargar el resumen:', error);
                setSummary([]);
            } finally {
                setLoading(false);
            }
        }
        loadSummary();
    }, []);

    const grandTotalQuintales = summary.reduce((sum, item) => sum + item.quintales, 0);

    if (loading) {
        return (
            <div className="card w-full max-w-sm p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-3 bg-gray-200 rounded"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card w-full max-w-sm mx-auto">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Quintales a Pagar ({month}/{year})</h3>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="btn-icon-gray">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4">
                    {summary.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-sm font-medium">• {item.arrendatario} ({item.cantidad} pago/s)</span>
                            <span className="text-sm font-semibold text-green-600">{formatQuintales(item.quintales)}</span>
                        </div>
                    ))}
                    {summary.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-semibold">Total:</span>
                                <span className="text-lg font-bold text-primary-600">{formatQuintales(grandTotalQuintales)}</span>
                            </div>
                        </div>
                    )}
                    {summary.length === 0 && (
                        <div className="text-center py-4">
                            <Leaf className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No hay quintales a pagar.</p>
                        </div>
                    )}
                </div>
            </div>

            {!isExpanded && (
                <div className="p-4 text-center">
                    <p className="text-sm font-semibold">Total Quintales a Pagar</p>
                    <p className="text-lg font-bold text-primary-600">{formatQuintales(grandTotalQuintales)}</p>
                </div>
            )}
        </div>
    );
}
