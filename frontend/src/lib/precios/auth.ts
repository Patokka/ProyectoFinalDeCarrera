import { PrecioDtoOut } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchPreciosAGD(): Promise<PrecioDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/precios/AGD`, {
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
        throw new Error(err.detail || "Error al obtener los precios de AGD");
    }

    return res.json();
}

export async function fetchPreciosBCR(): Promise<PrecioDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/precios/BCR`, {
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
        throw new Error(err.detail || "Error al obtener los precios de BCR");
    }

    return res.json();
}