{/**Creo que esté archivo no se esta usando para nada */}
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function login(cuil: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cuil, contrasena: password }),
    credentials: "include", // importante para cookies HttpOnly
  });

  if (!res.ok) throw new Error("Error en el login");
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al cerrar sesión");
  return res.json();
}
