import { RetencionDtoOut } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchRetenciones(): Promise<RetencionDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`${API_URL}/retenciones`, {
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

export async function fetchRetencionByFacturacionId(facturacion_id: number): Promise<RetencionDtoOut | null> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`${API_URL}/retenciones/facturacion/${facturacion_id}`, {
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

export async function putRetencion(retencion_id: number, fecha: string): Promise<RetencionDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        fecha_retencion: fecha,
    };
    const res = await fetch(`${API_URL}/retenciones/${retencion_id}`, {
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