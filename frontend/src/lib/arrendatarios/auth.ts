import { ArrendatarioDtoOut, ArrendatarioForm } from "../type";

/**
 * @brief Obtiene todos los arrendatarios del sistema.
 * @returns Una promesa que se resuelve en una lista de arrendatarios.
 * @throws Un error si no hay sesión activa o si ocurre un problema al obtener los arrendatarios.
 */
export async function fetchArrendatarios(): Promise<ArrendatarioDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/arrendatarios`, {
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

/**
 * @brief Elimina un arrendatario del sistema.
 * @param id El ID del arrendatario a eliminar.
 * @returns Una promesa que se resuelve en `true` si el arrendatario fue eliminado correctamente.
 * @throws Un error si no hay sesión activa o si ocurre un problema al eliminar el arrendatario.
 */
export async function deleteArrendatario(id: number) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/arrendatarios/${id}`, {
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

/**
 * @brief Obtiene un arrendatario por su ID.
 * @param arrendatario_id El ID del arrendatario a obtener.
 * @returns Una promesa que se resuelve en el arrendatario encontrado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al obtener el arrendatario.
 */
export async function fetchArrendatarioById(arrendatario_id: number): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/arrendatarios/${arrendatario_id}`, {
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

/**
 * @brief Crea un nuevo arrendatario en el sistema.
 * @param formData Los datos del arrendatario a crear.
 * @returns Una promesa que se resuelve en el arrendatario creado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al crear el arrendatario.
 */
export async function postArrendatario(formData: ArrendatarioForm): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail,
        localidad_id: formData.localidad_id,
    };

    const res = await fetch(`/api/arrendatarios`, {
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

/**
 * @brief Modifica un arrendatario existente en el sistema.
 * @param formData Los nuevos datos del arrendatario.
 * @param idArrendatario El ID del arrendatario a modificar.
 * @returns Una promesa que se resuelve en el arrendatario modificado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al modificar el arrendatario.
 */
export async function putArrendatario(formData: ArrendatarioForm, idArrendatario: number): Promise<ArrendatarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail || null,
        localidad_id: formData.localidad_id,
    };

    const res = await fetch(`/api/arrendatarios/${idArrendatario}`, {
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
        throw new Error(err.detail || "Error al modificar el arrendatario");
    }

    return res.json();
}