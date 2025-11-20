'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @component HomePage
 * @description La página raíz de la aplicación. Su única función es redirigir al usuario
 *              a la página de inicio de sesión (`/login`) si no está autenticado, o al
 *              dashboard (`/dashboard`) si ya existe un token de autenticación.
 * @returns {JSX.Element} Muestra un indicador de carga mientras se realiza la redirección.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay token de autenticación
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si está autenticado, redirigir al dashboard
      router.push('/dashboard');
    } else {
      // Si no está autenticado, redirigir al login
      router.push('/login');
    }
  }, [router]);

  // Mostrar loading mientras se verifica la autenticación
  return (
    <div className="bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}