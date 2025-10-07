import { PagoDtoOut, PagoForm, PaymentSummaryResponse } from "../type";

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

export async function fetchPagoById(pago_id: number): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/pagos/${pago_id}`, {
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
        throw new Error(err.detail || "Error al obtener el pago");
    }

    return res.json();
}

export async function cancelarPago(pago_id: number){
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/pagos/cancelar/${pago_id}`, {
        method: "PUT",
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
        throw new Error(err.detail || "Error al obtener el pago");
    }

    return true;
}

export async function postPago(formData: PagoForm): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");

    const body = {
        quintales: formData.quintales,
        vencimiento: formData.vencimiento,
        fuente_precio: formData.fuente_precio,
        arrendamiento_id: formData.arrendamiento_id,
        participacion_arrendador_id: formData.participacion_arrendador_id,
        dias_promedio: formData.dias_promedio,
        porcentaje: formData.porcentaje
    };

    const res = await fetch(`${API_URL}/pagos`, {
        method: "POST",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
    }

    if (res.status === 422) {
        const err = await res.json();
        throw new Error(err.detail || "Form mal formado");
    }


    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al crear pago");
    }

    return res.json();
}

export async function asignarPrecioPago(idPago: number): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/pagos/precio/${idPago}`, {
        method: "PUT",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        },
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
    }

    if (res.status === 422) {
        const err = await res.json();
        throw new Error(err.detail || "Form mal formado");
    }


    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al asignarle el precio al pago");
    }

    return res.json();
}