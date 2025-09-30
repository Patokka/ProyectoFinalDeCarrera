import { PagoDtoOut, PaymentSummaryResponse } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export async function fetchPaymentSummary(): Promise<PaymentSummaryResponse[]> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/pagos/resumen-mes`, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
        }
    })
    if (res.status === 401) {
    // limpiar sesión y redirigir
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }
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
  if (res.status === 401) {
    // limpiar sesión y redirigir
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
  }
  if (!res.ok) {
        throw new Error("Error al obtener resumen de pagos")
  }
  const data: string[] = await res.json()
  return data.map(d => new Date(d))
}

export async function generarCuotas(arrendamientoId: number): Promise<void> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/pagos/generar/${arrendamientoId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (res.status === 401) {
    // limpiar sesión y redirigir
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
  }

  if (!res.ok) {
    throw new Error("Error al generar cuotas");
  }
}

export async function fetchPagos(): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/pagos`, {
        method: "GET",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });

    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al obtener los pagos");
    }

    return res.json();
}

export async function facturarPago(pago: number): Promise<void>{
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/facturaciones/crear/${pago}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });  
  if (res.status === 401) {
      // limpiar sesión y redirigir
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
  }

  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error al obtener los pagos");
  }
}

export async function facturarPagos(pagos: number[]): Promise<void>{
    for (const p of pagos) {
      await facturarPago(p);
    }
}


export async function fetchPagosByArrendador(arrendador_id: number): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/pagos/arrendador/${arrendador_id}`, {
        method: "GET",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });

    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al obtener los pagos del arrendador");
    }

    return res.json();
}

export async function fetchPagosByArrendamiento(arrendamiento_id: number): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/pagos/arrendamiento/${arrendamiento_id}`, {
        method: "GET",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });

    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al obtener los pagos del arrendamiento");
    }

    return res.json();
}