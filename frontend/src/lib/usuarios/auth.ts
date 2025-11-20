import { UsuarioDtoOut, UsuarioForm} from "../type";

/**
 * @brief Obtiene todos los usuarios del sistema.
 * @returns Una promesa que se resuelve en una lista de usuarios.
 * @throws Un error si no hay sesión activa o si ocurre un problema al obtener los usuarios.
 */
export async function fetchUsuarios(): Promise<UsuarioDtoOut[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/usuarios`, {
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
        throw new Error(err.detail || "Error al obtener los usuarios");
    }
    return res.json();
}

/**
 * @brief Elimina un usuario del sistema.
 * @param idUsuario El ID del usuario a eliminar.
 * @returns Una promesa que se resuelve en `true` si el usuario fue eliminado correctamente.
 * @throws Un error si no hay sesión activa, si el usuario intenta eliminarse a sí mismo, o si ocurre un problema al eliminar el usuario.
 */
export async function deleteUsuario(idUsuario: number) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/usuarios/${idUsuario}`, {
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
    if (res.status === 400) {
        throw new Error("No se puede eliminar a sí mismo")
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "No se pudo eliminar el usuario");
    }
    return true;
}

/**
 * @brief Crea un nuevo usuario en el sistema.
 * @param formData Los datos del usuario a crear.
 * @returns Una promesa que se resuelve en el usuario creado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al crear el usuario.
 */
export async function postUsuario(formData: UsuarioForm): Promise<UsuarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        contrasena: formData.contrasena,
        cuil: formData.cuil,
        mail: formData.mail,
        rol: formData.rol
    };
    const res = await fetch(`/api/usuarios`, {
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
        throw new Error(err.detail || "Error al crear el usuario");
    }
    return res.json();
}

/**
 * @brief Obtiene un usuario por su ID.
 * @param idUsuario El ID del usuario a obtener.
 * @returns Una promesa que se resuelve en el usuario encontrado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al obtener el usuario.
 */
export async function fetchUsuarioById(idUsuario: number): Promise<UsuarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const res = await fetch(`/api/usuarios/${idUsuario}`, {
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
        throw new Error(err.detail || "Error al obtener el usuario");
    }
    return res.json();
}

/**
 * @brief Modifica un usuario existente en el sistema.
 * @param formData Los nuevos datos del usuario.
 * @param idUsuario El ID del usuario a modificar.
 * @returns Una promesa que se resuelve en el usuario modificado.
 * @throws Un error si no hay sesión activa o si ocurre un problema al modificar el usuario.
 */
export async function putUsuario(formData: UsuarioForm, idUsuario: number): Promise<UsuarioDtoOut> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        rol: formData.rol,
        contrasena: formData.contrasena,
        cuil: formData.cuil,
        mail: formData.mail,
    };
    const res = await fetch(`/api/usuarios/${idUsuario}`, {
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
        throw new Error(err.detail || "Error al modificar el usuario");
    }
    return res.json();
}

/**
 * @brief Cambia la contraseña del usuario actual.
 * @param contrasenaActual La contraseña actual del usuario.
 * @param contrasenaNueva La nueva contraseña para el usuario.
 * @returns Una promesa que se resuelve cuando la contraseña ha sido cambiada correctamente.
 * @throws Un error si no hay sesión activa o si ocurre un problema al cambiar la contraseña.
 */
export async function cambiarContrasena(contrasenaActual: string, contrasenaNueva: string): Promise<void> {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        throw new Error("No hay sesión activa");
    }
    const body = {
        contrasenaActual,
        contrasenaNueva,
    };
    const res = await fetch(`/api/usuarios/cambiar-contrasena`, {
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
        throw new Error(err.detail || "Formulario mal formado");
    }
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al cambiar la contraseña");
    }
    return;
}