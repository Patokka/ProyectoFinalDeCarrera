import { LocalidadDtoOut, ProvinciaDtoOut } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProvincias(): Promise<ProvinciaDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/provincias`, {
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


export async function fetchLocalidades(provincia_id: number): Promise<LocalidadDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/provincias/${provincia_id}/localidades`, {
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