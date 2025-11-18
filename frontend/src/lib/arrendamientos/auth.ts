import { ArrendamientoDtoOut, ArrendamientoForm, ParticipacionArrendador, ParticipacionArrendadorDtoOut } from "../type";

/**
 * @file auth.ts
 * @description Funciones para interactuar con la API de arrendamientos y participaciones.
 */

/**
 * @function fetchArrendamientos
 * @description Obtiene todos los arrendamientos.
 * @returns {Promise<ArrendamientoDtoOut[]>} Lista de arrendamientos.
 */
export async function fetchArrendamientos(): Promise<ArrendamientoDtoOut[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos`, { headers: { "Authorization": `Bearer ${token}` } });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener arrendamientos");
  return res.json();
}

/**
 * @function postArrendamiento
 * @description Crea un nuevo arrendamiento.
 * @param {ArrendamientoForm} formData - Datos del arrendamiento.
 * @returns {Promise<ArrendamientoDtoOut>} El arrendamiento creado.
 */
export async function postArrendamiento(formData: ArrendamientoForm): Promise<ArrendamientoDtoOut> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "Error al crear el arrendamiento");
  return res.json();
}

/**
 * @function postParticipacion
 * @description Guarda una participación de arrendador.
 * @param {ParticipacionArrendador} participacion - Datos de la participación.
 */
export async function postParticipacion(participacion: ParticipacionArrendador): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/participaciones`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(participacion),
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error("Error al guardar participación");
}

/**
 * @function postParticipaciones
 * @description Guarda múltiples participaciones para un arrendamiento.
 * @param {ParticipacionArrendador[]} participaciones - Array de participaciones.
 * @param {number} arrendamientoId - ID del arrendamiento.
 */
export async function postParticipaciones(participaciones: ParticipacionArrendador[], arrendamientoId: number): Promise<void> {
  for (const p of participaciones) {
    await postParticipacion({ ...p, arrendamiento_id: arrendamientoId });
  }
}

/**
 * @function fetchArrendamientoById
 * @description Obtiene un arrendamiento por su ID.
 * @param {number} arrendamiento_id - ID del arrendamiento.
 * @returns {Promise<ArrendamientoDtoOut>} El arrendamiento.
 */
export async function fetchArrendamientoById(arrendamiento_id: number): Promise<ArrendamientoDtoOut> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos/${arrendamiento_id}`, { headers: { "Authorization": `Bearer ${token}` } });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener el arrendamiento");
  return res.json();
}

/**
 * @function fetchParticipacionesByArrendamiento
 * @description Obtiene las participaciones de un arrendamiento.
 * @param {number} arrendamiento_id - ID del arrendamiento.
 * @returns {Promise<ParticipacionArrendadorDtoOut[]>} Lista de participaciones.
 */
export async function fetchParticipacionesByArrendamiento(arrendamiento_id: number): Promise<ParticipacionArrendadorDtoOut[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos/participaciones/${arrendamiento_id}`, { headers: { "Authorization": `Bearer ${token}` } });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener participaciones");
  return res.json();
}

/**
 * @function cancelarArrendamiento
 * @description Cancela un arrendamiento.
 * @param {number} arrendamiento_id - ID del arrendamiento.
 * @returns {Promise<boolean>} `true` si fue exitoso.
 */
export async function cancelarArrendamiento(arrendamiento_id: number) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos/cancelar/${arrendamiento_id}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "No se pudo cancelar el arrendamiento");
  return true;
}

/**
 * @function fetchArrendamientosActivos
 * @description Obtiene solo los arrendamientos activos.
 * @returns {Promise<ArrendamientoDtoOut[]>} Lista de arrendamientos activos.
 */
export async function fetchArrendamientosActivos(): Promise<ArrendamientoDtoOut[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos/activos`, { headers: { "Authorization": `Bearer ${token}` } });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "Error al obtener arrendamientos activos");
  return res.json();
}

/**
 * @function deleteArrendamiento
 * @description Elimina un arrendamiento.
 * @param {number} arrendamiento_id - ID del arrendamiento.
 * @returns {Promise<boolean>} `true` si fue exitoso.
 */
export async function deleteArrendamiento(arrendamiento_id: number) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay sesión activa");
  }
  const res = await fetch(`/api/arrendamientos/${arrendamiento_id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).detail || "No se pudo eliminar el arrendamiento");
  return true;
}
