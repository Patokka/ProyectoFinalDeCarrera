'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/components/context/AuthContext'
import { formatCuitDisplay } from '@/lib/helpers'

/**
 * @page LoginPage
 * @description Página de inicio de sesión de la aplicación.
 *              Permite a los usuarios autenticarse con su CUIL y contraseña.
 * @returns {JSX.Element} El formulario de inicio de sesión.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({ cuil: '', contrasena: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de inicio de sesión.
   * @param {React.FormEvent} e - El evento del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await login(formData.cuil.replace(/-/g,""), formData.contrasena)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * @function handleInputChange
   * @description Actualiza el estado del formulario cuando los campos de entrada cambian.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-gray-50 flex items-start justify-center pt-20 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Inicio de Sesión</h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="cuil" className="label-class">CUIT o CUIL</label>
            <input
              id="cuil"
              name="cuil"
              type="text"
              required
              value={formatCuitDisplay(formData.cuil)}
              onChange={handleInputChange}
              placeholder="Ej. 99-99999999-9"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="contrasena" className="label-class">Contraseña</label>
            <div className="relative">
              <input
                id="contrasena"
                name="contrasena"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.contrasena}
                onChange={handleInputChange}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center items-center space-x-2 py-3"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
