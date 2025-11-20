import { ArrendadorDtoOut, ArrendadorForm } from "../type";
/**
 * @file auth.ts
 * @description Funciones para interactuar con la API de arrendadores.
 *              Incluye operaciones CRUD (Crear, Leer, Actualizar, Eliminar).
 *              Maneja la autenticación y redirección automática al login si la sesión expira.
 */

/**
 * @function fetchArrendadores
 * @description Obtiene una lista de todos los arrendadores.
 * @returns {Promise<ArrendadorDtoOut[]>} Una promesa que se resuelve con la lista de arrendadores.
 */
export async function fetchArrendadores(): Promise<ArrendadorDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/arrendadores`, {
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

/**
 * @function deleteArrendador
 * @description Elimina un arrendador por su ID.
 * @param {number} arrendador_id - El ID del arrendador a eliminar.
 * @returns {Promise<boolean>} `true` si la eliminación fue exitosa.
 */
export async function deleteArrendador(arrendador_id: number) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/arrendadores/${arrendador_id}`, {
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

/**
 * @function fetchArrendadorById
 * @description Obtiene un arrendador específico por su ID.
 * @param {number} arrendador_id - El ID del arrendador.
 * @returns {Promise<ArrendadorDtoOut>} El objeto del arrendador.
 */
export async function fetchArrendadorById(arrendador_id: number): Promise<ArrendadorDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/arrendadores/${arrendador_id}`, {
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

/**
 * @function postArrendador
 * @description Crea un nuevo arrendador.
 * @param {ArrendadorForm} formData - Los datos del nuevo arrendador.
 * @returns {Promise<ArrendadorDtoOut>} El arrendador creado.
 */
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

    const res = await fetch(`/api/arrendadores`, {
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
 * @function putArrendador
 * @description Actualiza un arrendador existente.
 * @param {ArrendadorForm} formData - Los datos a actualizar.
 * @param {number} arrendador_id - El ID del arrendador a actualizar.
 * @returns {Promise<ArrendadorDtoOut>} El arrendador actualizado.
 */
export async function putArrendador(formData: ArrendadorForm, arrendador_id: number): Promise<ArrendadorDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const body = {
        nombre_o_razon_social: formData.nombre_o_razon_social,
        cuil: formData.cuil,
        condicion_fiscal: formData.condicion_fiscal,
        mail: formData.mail || null,
        telefono: formData.telefono || null,
        localidad_id: formData.localidad_id,
        descripcion: formData.descripcion || null,
    };

    const res = await fetch(`/api/arrendadores/${arrendador_id}`, {
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