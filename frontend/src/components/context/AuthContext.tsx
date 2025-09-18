'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface User {
  nombre: string
  apellido: string
  id: number
}

interface AuthContextType {
  user: User | null
  login: (cuil: string, contrasena: string) => Promise<void>
  logout: () => void
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const login = async (cuil: string, contrasena: string) => {
    const res = await fetch(`${API_URL}/login`, {
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
    }

    setUser(loggedUser)
    localStorage.setItem('user', JSON.stringify(loggedUser))
    localStorage.setItem('token', data.access_token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
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

// Hook para consumir el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
