import { Recipient } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchConfiguracion(clave: string): Promise<string | null> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`${API_URL}/retenciones/configuracion/${clave}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data.valor ?? null;
}

export async function actualizarConfiguracion(clave: string, valor: string): Promise<void> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`${API_URL}/retenciones/configuracion`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ clave, valor }),
    });
    
    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al actualizar la configuración");
    }
}

export async function eliminarConfiguracion(clave: string): Promise<void> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`${API_URL}/retenciones/configuracion/${clave}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
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
        throw new Error(err.detail || "Error al eliminar la configuración");
    }
}


export async function fetchDestinatarios(): Promise<Recipient[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa, redirigiendo a login");
    }

    const res = await fetch(`${API_URL}/retenciones/configuracion/destinatarios`, {  
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
    }

    if (!res.ok) {
        throw new Error("Error al cargar los destinatarios");
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Convertimos cada string en { clave, valor }
    return data.map((email: string, i: number) => ({
        clave: `DESTINATARIO_${i + 1}`,
        valor: email,
    }));
}

export async function putCorreos(recipients: Recipient[]): Promise<boolean> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    //Obtener todos los destinatarios existentes para detectar cuáles eliminar
    const resGet = await fetch(`${API_URL}/retenciones/configuracion/destinatarios`, {
        headers: { "Authorization": `Bearer ${token}` },
    });

    if (resGet.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
    }

    const existing: string[] = resGet.ok ? await resGet.json() : [];

    //Actualizar / agregar los actuales
    for (const r of recipients) {
        const res = await fetch(`${API_URL}/retenciones/configuracion`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                clave: r.clave,
                valor: r.valor,
            }),
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
            throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const message = errorData.detail || `Error al guardar ${r.clave}`;
            throw new Error(message);
        }
    }

    //Eliminar los que ya no están
    for (let i = recipients.length + 1; i <= existing.length; i++) {
        const resDel = await fetch(`${API_URL}/retenciones/configuracion/DESTINATARIO_${i}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (resDel.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
            throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
        }
    }

    return true;
}