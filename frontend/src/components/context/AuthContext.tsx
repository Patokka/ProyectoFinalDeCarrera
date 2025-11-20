'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

/**
 * @interface User
 * @description Define la estructura del objeto de usuario.
 */
interface User {
  nombre: string
  apellido: string
  id: number
  rol: string
}

/**
 * @interface AuthContextType
 * @description Define el tipo del contexto de autenticación, incluyendo el usuario y las funciones de login/logout.
 */
interface AuthContextType {
  user: User | null
  login: (cuil: string, contrasena: string) => Promise<void>
  logout: () => void
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * @provider AuthProvider
 * @description Proveedor de contexto que gestiona el estado de autenticación del usuario.
 *              Maneja el login, logout y la persistencia del estado en `localStorage`.
 * @param {object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  /**
   * @function login
   * @description Realiza una solicitud de login a la API y, si es exitosa,
   *              actualiza el estado del usuario y guarda los datos en `localStorage`.
   */
  const login = async (cuil: string, contrasena: string) => {
    const res = await fetch(`/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuil, contrasena }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Error al iniciar sesión')
    }

    const data = await res.json()

    const loggedUser: User = {
      nombre: data.nombre,
      apellido: data.apellido,
      id: data.id,
      rol: data.rol,
    }

    setUser(loggedUser)
    localStorage.setItem('user', JSON.stringify(loggedUser))
    localStorage.setItem('token', data.access_token)
  }

  /**
   * @function logout
   * @description Cierra la sesión del usuario, eliminando sus datos del estado y de `localStorage`.
   */
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  /**
   * @effect
   * @description Sincroniza el estado de autenticación entre diferentes pestañas del navegador
   *              escuchando cambios en `localStorage`.
   */
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      if (!storedUser || !token) {
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // También verificamos al montar el componente
    handleStorageChange()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * @hook useAuth
 * @description Hook personalizado para consumir fácilmente el contexto de autenticación.
 * @returns {AuthContextType} El contexto de autenticación.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
