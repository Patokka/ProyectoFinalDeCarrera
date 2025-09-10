const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PaymentSummaryResponse {
  arrendatario: string
  cantidad: number
  monto: number
}

export async function fetchPaymentSummary(): Promise<PaymentSummaryResponse[]> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/pagos/resumen-mes`, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
        }
    })
    if (!res.ok) {
        throw new Error("Error al obtener resumen de pagos")
    }
    return res.json()
}

export async function fetchPaymentDates(month: number, year: number): Promise<Date[]> {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/pagos/vencimientos-mes?mes=${month}&anio=${year}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error("Error al obtener fechas de pago")
  const data: string[] = await res.json()
  return data.map(d => new Date(d))
}