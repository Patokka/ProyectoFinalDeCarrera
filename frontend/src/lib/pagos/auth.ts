import { PagoDia, PagoDtoOut, PagoForm, PaymentSummaryResponse, QuintalesSummaryResponse } from "../type";

/**
 * @function fetchPaymentSummary
 * @description Obtiene un resumen de pagos del mes actual para el sidebar
 * @returns {Promise<PaymentSummaryResponse[]>} Una promesa que se resuelve con un arreglo de pagos.
 */
export async function fetchPaymentSummary(): Promise<PaymentSummaryResponse[]> {
    const token = localStorage.getItem("token")
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/resumen-mes`, {
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

/**
 * @function fetchPaymentDates
 * @description Obtiene las fechas de pagos de un determinado mes.
 * @returns {Promise<PagoDia[]>} Una promesa que se resuelve con un arreglo de pagos y vencimientos.
 */
export async function fetchPaymentDates(month: number, year: number): Promise<PagoDia[]> {
    const token = localStorage.getItem("token")
    if (!token) {
        window.location.href = "/login"
        throw new Error("No hay sesión activa")
    }

    const res = await fetch(`/api/pagos/vencimientos-mes?mes=${month}&anio=${year}`, {
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
    })
    if (res.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión")
    }
    if (!res.ok) {
        throw new Error("Error al obtener vencimientos")
    }

    const data: PagoDia[] = await res.json()
    return data
}

/**
 * @function generarCuotas
 * @description Genera las cuotas pertinentes a un arrendamiento.
 * @returns {Promise<void>} Una promesa que se resuelve con void.
 */
export async function generarCuotas(arrendamientoId: number): Promise<void> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/generar/${arrendamientoId}`, {
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

/**
 * @function fetchPagos
 * @description Obtiene un arreglo de pagos.
 * @returns {Promise<PagoDtoOut[]>} Una promesa que se resuelve con un arreglo de pagos.
 */
export async function fetchPagos(): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos`, {
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

/**
 * @function facturarPago
 * @description actualiza el estado de un pago y crea la facturación y retención correspondiente.
 * @returns {Promise<void>} Una promesa que se resuelve con un void.
 */
export async function facturarPago(pago: number): Promise<void>{
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/facturaciones/crear/${pago}`, {
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
        throw new Error(err.detail || "Error al facturar el pago");
    }
}

/**
 * @function facturarPagos
 * @description Factura varios pagos
 * @returns {Promise<void>} Una promesa que se resuelve con un void.
 */
export async function facturarPagos(pagos: number[]): Promise<void>{
    for (const p of pagos) {
        await facturarPago(p);
    }
}

/**
 * @function fetchPagosByArrendador
 * @description Obtiene un arreglo de pagos en base al id de un arrendador.
 * @returns {Promise<PagoDtoOut[]>} Una promesa que se resuelve con un arreglo de pagos.
 */
export async function fetchPagosByArrendador(arrendador_id: number): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/arrendador/${arrendador_id}`, {
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

/**
 * @function fetchPagosByArrendamiento
 * @description Obtiene un arreglo de pagos en base al id de un arrendamiento.
 * @returns {Promise<PagoDtoOut[]>} Una promesa que se resuelve con un arreglo de pagos.
 */
export async function fetchPagosByArrendamiento(arrendamiento_id: number): Promise<PagoDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/arrendamiento/${arrendamiento_id}`, {
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

/**
 * @function fetchPagoById
 * @description Obtiene un pago.
 * @returns {Promise<PagoDtoOut[]>} Una promesa que se resuelve con un pago.
 */
export async function fetchPagoById(pago_id: number): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/${pago_id}`, {
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

/**
 * @function cancelarPagos
 * @description Cancela un pago actualizando su estado.
 * @returns {Promise<PagoDtoOut>} Una promesa que se resuelve con un pago.
 */
export async function cancelarPago(pago_id: number){
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/pagos/cancelar/${pago_id}`, {
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

/**
 * @function postPago
 * @description Crea un pago particular.
 * @returns {Promise<PagoDtoOut>} Una promesa que se resuelve con pago.
 */
export async function postPago(formData: PagoForm): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        quintales: formData.quintales,
        vencimiento: formData.vencimiento,
        fuente_precio: formData.fuente_precio,
        arrendamiento_id: formData.arrendamiento_id,
        participacion_arrendador_id: formData.participacion_arrendador_id,
        dias_promedio: formData.dias_promedio,
        porcentaje: formData.porcentaje
    };

    const res = await fetch(`/api/pagos`, {
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
        throw new Error(err.detail || "Error al crear el pago");
    }

    return res.json();
}

/**
 * @function asignarPrecioPago
 * @description Calcula y asigna el precio a un pago, tanto el promedio como el monto total.
 * @returns {Promise<PagoDtoOut>} Una promesa que se resuelve con un pago.
 */
export async function asignarPrecioPago(idPago: number): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/pagos/precio/${idPago}`, {
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

/**
 * @function fetchNextMonthQuintalesSummary
 * @description Obtiene un resumen de quintales del próximo mes.
 * @returns {Promise<QuintalesSummaryResponse[]>} Una promesa que se resuelve con un resumen de quintales.
 */
export async function fetchNextMonthQuintalesSummary(): Promise<QuintalesSummaryResponse[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/pagos/resumen-quintales-proximo-mes`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
    }

    if (!res.ok) {
        throw new Error("Error al obtener el resumen de quintales del próximo mes.");
    }

    return res.json();
}

/**
 * @function putPago
 * @description Actualiza un pago particular.
 * @returns {Promise<PagoDtoOut>} Una promesa que se resuelve con pago.
 */
export async function putPago(pago_id: number, formData: PagoForm): Promise<PagoDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        quintales: formData.quintales,
        vencimiento: formData.vencimiento,
        fuente_precio: formData.fuente_precio,
        arrendamiento_id: formData.arrendamiento_id,
        participacion_arrendador_id: formData.participacion_arrendador_id,
        dias_promedio: formData.dias_promedio,
        porcentaje: formData.porcentaje,
        monto_a_pagar: formData.monto_a_pagar,
        precio_promedio: formData.precio_promedio,
    };
    const res = await fetch(`/api/pagos/${pago_id}`, {
        method: "PUT",
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
        throw new Error(err.detail || "Error al modificar el pago");
    }

    return res.json();
}