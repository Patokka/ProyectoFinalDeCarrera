import { FacturacionDtoOut } from "../type";

/**
 * @function fetchFacturaciones
 * @description Obtiene una lista de facturaciones.
 * @returns {Promise<FacturacionDtoOut[]>} Una promesa que se resuelve con un arreglo de facturaciones.
 */
export async function fetchFacturaciones(): Promise<FacturacionDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/facturaciones`, {
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
        throw new Error(err.detail || "Error al obtener las facturaciones");
    }

    return res.json();
}

/**
 * @function fetchFacturacionesByArrendatario}
 * @description Obtiene una lista de facturaciones en base al id de un arrendatario.
 * @returns {Promise<FacturacionDtoOut[]>} Una promesa que se resuelve con un arreglo de facturaciones.
 */
export async function fetchFacturacionesByArrendatario(arrendatario_id: number): Promise<FacturacionDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/facturaciones/arrendatario/${arrendatario_id}`, {
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
        throw new Error(err.detail || "Error al obtener las facturaciones del arrendatario");
    }

    return res.json();
}

/**
 * @function fetchFacturacionById
 * @description Obtiene una facturacion.
 * @returns {Promise<FacturacionDtoOut[]>} Una promesa que se resuelve con una facturacion.
 */
export async function fetchFacturacionById(facturacion_id: number): Promise<FacturacionDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/facturaciones/${facturacion_id}`, {
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
        throw new Error(err.detail || "Error al obtener la facturacion");
    }

    return res.json();
}

/**
 * @function putFacturacionFacturaciones
 * @description Actualiza una facturación.
 * @returns {Promise<FacturacionDtoOut>} Una promesa que se resuelve con una facturación.
 */
export async function putFacturacion(facturacion_id: number, fecha: string, monto_facturacion: number|undefined): Promise<FacturacionDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        fecha_facturacion: fecha,
        monto_facturacion: monto_facturacion,
    };
    const res = await fetch(`/api/facturaciones/${facturacion_id}`, {
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
        throw new Error(err.detail || "Error al modificar la facturación");
    }

    return res.json();
}