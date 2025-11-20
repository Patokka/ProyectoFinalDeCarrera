import { RetencionDtoOut } from "../type";

/**
 * @function fetchRetenciones
 * @description Obtiene un arreglo de retenciones.
 * @returns {Promise<RetencionDtoOut[]>} Una promesa que se resuelve con un arreglo de retenciones.
 */
export async function fetchRetenciones(): Promise<RetencionDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/retenciones`, {
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
        throw new Error(err.detail || "Error al obtener las retenciones");
    }

    return res.json();
}

/**
 * @function fetchRetencionByFacturacionId
 * @description Obtiene una retención por su ID de facturación.
 * @returns {Promise<RetencionDtoOut>} Una promesa que se resuelve con una retención.
 */
export async function fetchRetencionByFacturacionId(facturacion_id: number): Promise<RetencionDtoOut | null> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/retenciones/facturacion/${facturacion_id}`, {
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
        throw new Error(err.detail || "Error al obtener la retencion");
    }

    return res.json();
}

/**
 * @function putRetencion
 * @description Actualiza una retención con los datos proporcionados.
 * @returns {Promise<RetencionDtoOut>} Una promesa que se resuelve con una retención.
 */
export async function putRetencion(retencion_id: number, fecha: string, total_retencion: number | undefined): Promise<RetencionDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        fecha_retencion: fecha,
        total_retencion: total_retencion,
    };
    const res = await fetch(`/api/retenciones/${retencion_id}`, {
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
        throw new Error(err.detail || "Error al modificar la retención");
    }

    return res.json();
}