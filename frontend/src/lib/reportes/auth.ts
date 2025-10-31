const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchReporte(endpoint: string, params: Record<string, string>): Promise<Blob> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }    
    console.log(params)
    const url = new URL(endpoint, API_URL);
    // Agregar parámetros al query string
    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
    });
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
        "Authorization": `Bearer ${token}`,
        },
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Sesión expirada. Redirigiendo al inicio de sesión.");
    }
    if (!res.ok) {
        // Intentamos parsear mensaje de error
        try {
        const err = await res.json();
        throw new Error(err.detail || "Error al generar el reporte.");
        } catch {
        throw new Error("Error al generar el reporte.");
        }
    }
    return res.blob(); // retorna el archivo para descarga
}

export async function updateJobConfig(data: {job_id: string; hour: number; minute: number; day?: number; active: boolean;}) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`${API_URL}/actualizar-job`, {
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al actualizar la configuración");
    }
    return res.json();
}

export async function fetchReporteArrendador(endpoint: string, params: {inicio: string, fin: string, arrendador_id: number}): Promise<Blob> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }    
    const url = new URL(endpoint, API_URL);
    // Agregar parámetros al query string
    url.searchParams.append("inicio", params.inicio);
    url.searchParams.append("fin", params.fin);
    url.searchParams.append("arrendador_id", params.arrendador_id.toString());
    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
        "Authorization": `Bearer ${token}`,
        },
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Sesión expirada. Redirigiendo al inicio de sesión.");
    }
    if (!res.ok) {
        // Intentamos parsear mensaje de error
        try {
        const err = await res.json();
        throw new Error(err.detail || "Error al generar el reporte.");
        } catch {
        throw new Error("Error al generar el reporte.");
        }
    }
    return res.blob(); // retorna el archivo para descarga
}