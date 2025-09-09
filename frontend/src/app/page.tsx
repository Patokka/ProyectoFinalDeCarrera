'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}