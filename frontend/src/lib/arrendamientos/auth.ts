import { ArrendamientoDtoOut, ArrendamientoForm, ParticipacionArrendador } from "../type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchArrendamientos(): Promise<ArrendamientoDtoOut[]> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/arrendamientos`, {
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
    throw new Error(err.detail || "Error al obtener arrendamientos");
  }

  return res.json();
}

export async function postArrendamiento(formData: ArrendamientoForm): Promise<ArrendamientoDtoOut> {
  const token = localStorage.getItem("token");

  const body = {
    tipo: formData.tipo,
    localidad_id: Number(formData.localidad_id),
    usuario_id: Number(formData.usuario_id),
    arrendatario_id: Number(formData.arrendatario_id),
    fecha_inicio: formData.fecha_inicio,
    fecha_fin: formData.fecha_fin,
    quintales: Number(formData.quintales),
    hectareas: Number(formData.hectareas),
    plazo_pago: formData.plazo_pago,
    dias_promedio: formData.dias_promedio,
    origen_precio: formData.origen_precio,
    porcentaje_aparceria: Number(formData.porcentaje_aparceria),
    descripcion: formData.descripcion,
  };

  const res = await fetch(`${API_URL}/arrendamientos`, {
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
    throw new Error(err.detail || "Error al crear arrendamiento");
  }

  return res.json();
}

//Guarda individualmente una participación
export async function postParticipacion(participacion: ParticipacionArrendador): Promise<void> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/participaciones`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(participacion),
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Se perdió la sesión, redirigiendo a inicio de sesión");
  }
  if (!res.ok) {
    throw new Error("Error al guardar participación");
  }
}

export async function postParticipaciones(participaciones: ParticipacionArrendador[],arrendamientoId: number): Promise<void> {
  for (const p of participaciones) {
    const participacionConId = { ...p, arrendamiento_id: arrendamientoId };
    await postParticipacion(participacionConId);
  }
}