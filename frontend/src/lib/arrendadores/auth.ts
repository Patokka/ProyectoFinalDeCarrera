import { ArrendadorDtoOut } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchArrendadores(): Promise<ArrendadorDtoOut[]> {
    const token = localStorage.getItem("token");

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