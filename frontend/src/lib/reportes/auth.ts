
/**
 * @function fetchReporte
 * @description Obtiene un reporte en formato Blob desde el endpoint especificado con los parámetros dados.
 * @returns {Promise<{Blob,string}>} Una promesa que se resuelve con un blob y nombre de archivo.
 */
export async function fetchReporte(endpoint: string, params: Record<string, string>): Promise<{ blob: Blob, filename: string }> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }    
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
    });
    const url = `${endpoint}?${query.toString()}`;
    const res = await fetch(url, {
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
        try {
            const err = await res.json();
            throw new Error(err.detail || "Error al generar el reporte.");
        } catch {
            throw new Error("Error al generar el reporte.");
        }
    }
    const disposition = res.headers.get('Content-Disposition');
    let filename = `reporte_${params.mes || ''}-${params.anio || ''}.pdf`; // Nombre por defecto
    if (disposition && disposition.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=(['"]?)(.*?)\1(?:;|$)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[2]) {
            filename = matches[2].replace(/['"]/g, ''); // Limpia comillas
        }
    }
    return {
        blob: await res.blob(),
        filename: filename
    };
}

/**
 * @function updateJobConfig
 * @description Actualiza la configuración de un job con los datos proporcionados.
 * 
 */
export async function updateJobConfig(data: {job_id: string; hour: number; minute: number; day?: number; active: boolean;}) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/actualizar-job`, {
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

/**
 * @function fetchReporteArrendador
 * @description Obtiene un reporte en formato Blob para un arrendador específico.
 * @returns {Promise<{Blob,string}>} Una promesa que se resuelve con un blob y nombre de archivo.
 */
export async function fetchReporteArrendador(endpoint: string, params: {inicio: string, fin: string, arrendador_id: number}): Promise<Blob> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const query = new URLSearchParams({
        inicio: params.inicio,
        fin: params.fin,
        arrendador_id: params.arrendador_id.toString()
    });
    const url = `${endpoint}?${query.toString()}`;
    const res = await fetch(url, {
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
    return res.blob(); 
}

/**
 * @function fetchJobConfig
 * @description Obtiene la configuración de un job específico.
 * 
 */
export async function fetchJobConfig(jobId: string) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/job-config/${jobId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al obtener la configuración del job");
    }
    return res.json();
}