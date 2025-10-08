import { ArrendadorDtoOut, ArrendadorForm } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchArrendadores(): Promise<ArrendadorDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`${API_URL}/arrendadores`, {
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
        throw new Error(err.detail || "Error al obtener los arrendadores");
    }

    return res.json();
}


export async function deleteArrendador(id: number) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`${API_URL}/arrendadores/${id}`, {
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
        throw new Error(data.detail || "No se pudo eliminar el arrendador");
    }

    return true;
}

export async function fetchArrendadorById(id: number): Promise<ArrendadorDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`${API_URL}/arrendadores/${id}`, {
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
        throw new Error(err.detail || "Error al obtener el arrendador");
    }

    return res.json();
}

export async function postArrendador(formData: ArrendadorForm): Promise<ArrendadorDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        nombre_o_razon_social: formData.nombre_o_razon_social,
        cuil: formData.cuil,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail,
        telefono: formData.telefono,
        localidad_id: formData.localidad_id,
        descripcion: formData.descripcion,
    };

    const res = await fetch(`${API_URL}/arrendadores`, {
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
        throw new Error(err.detail || "Error al crear el arrendador");
    }

    return res.json();
}

export async function putArrendador(formData: ArrendadorForm, idArrendador: number): Promise<ArrendadorDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        nombre_o_razon_social: formData.nombre_o_razon_social,
        cuil: formData.cuil,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail,
        telefono: formData.telefono,
        localidad_id: formData.localidad_id,
        descripcion: formData.descripcion,
    };

    const res = await fetch(`${API_URL}/arrendadores/${idArrendador}`, {
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
        throw new Error(err.detail || "Error al modificar el arrendador");
    }

    return res.json();
}