const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchReporte(endpoint: string, params: Record<string, string>): Promise<Blob> {
    const token = localStorage.getItem("token");
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
        throw new Error(err.detail || "Error al actualizar configuración");
    }

    return res.json();
}