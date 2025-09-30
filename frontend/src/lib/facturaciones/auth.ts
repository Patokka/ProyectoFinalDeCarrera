import { FacturacionDtoOut } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchFacturaciones(): Promise<FacturacionDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/facturaciones`, {
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
        throw new Error(err.detail || "Error al obtener las facturaciones");
    }

    return res.json();
}

export async function fetchFacturacionesByArrendatario(arrendatario_id: number): Promise<FacturacionDtoOut[]> {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/facturaciones/arrendatario/${arrendatario_id}`, {
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
        throw new Error(err.detail || "Error al obtener las facturaciones del arrendatario");
    }

    return res.json();
}