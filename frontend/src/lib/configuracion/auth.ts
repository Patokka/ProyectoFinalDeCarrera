const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchConfiguracion(clave: string): Promise<string | null> {
    const token = localStorage.getItem("token");
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