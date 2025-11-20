import { LocalidadDtoOut, ProvinciaDtoOut } from "../type";

/**
 * @function fetchProvincias
 * @description Obtiene un arreglo de provincias.
 * @returns {Promise<ProvinciaDtoOut[]>} Una promesa que se resuelve con un arreglo de provincias.
 */
export async function fetchProvincias(): Promise<ProvinciaDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }

    const res = await fetch(`/api/provincias`, {
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
        throw new Error(err.detail || "Error al obtener las provincias");
    }

    return res.json();
}

/**
 * @function fetchLocalidades
 * @description Obtiene un arreglo de localidades en base a un ID de provincia.
 * @returns {Promise<LocalidadDtoOut[]>} Una promesa que se resuelve con un arreglo de localidades.
 */
export async function fetchLocalidades(provincia_id: number): Promise<LocalidadDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    
    const res = await fetch(`/api/provincias/${provincia_id}/localidades`, {
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
        throw new Error(err.detail || "Error al obtener las localidades");
    }

    return res.json();
}