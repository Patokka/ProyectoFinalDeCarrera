import { ArrendatarioDtoOut, ArrendatarioForm } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchArrendatarios(): Promise<ArrendatarioDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/arrendatarios`, {
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
        throw new Error(err.detail || "Error al obtener los arrendatarios");
    }

    return res.json();
}

export async function deleteArrendatario(id: number) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/arrendatarios/${id}`, {
    method: "DELETE",
    headers: {
        "Authorization": `Bearer ${token}`,
    },
    body: undefined,
    });

    if (res.status === 401) {
        // limpiar sesión y redirigir
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión")
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "No se pudo eliminar el arrendatario");
    }

    return true;
}

export async function fetchArrendatarioById(arrendatario_id: number): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/arrendatarios/${arrendatario_id}`, {
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
        throw new Error(err.detail || "Error al obtener el arrendatario");
    }

    return res.json();
}

export async function postArrendatario(formData: ArrendatarioForm): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");

    const body = {
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail,
        localidad_id: formData.localidad_id,
    };

    const res = await fetch(`${API_URL}/arrendatarios`, {
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
        throw new Error(err.detail || "Error al crear arrendador");
    }

    return res.json();
}

export async function putArrendatario(formData: ArrendatarioForm, idArrendatario: number): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");

    const body = {
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail,
        localidad_id: formData.localidad_id,
    };

    const res = await fetch(`${API_URL}/arrendatarios/${idArrendatario}`, {
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
        throw new Error(err.detail || "Error al crear arrendador");
    }

    return res.json();
}