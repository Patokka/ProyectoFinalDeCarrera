'use client'

import { useAuth } from "@/components/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

/**
 * @interface ProtectedRouteProps
 * @description Propiedades para el componente ProtectedRoute.
 * @property {ReactNode} children - Los componentes hijos que se renderizarán si el usuario está autorizado.
 * @property {string[]} [allowedRoles] - Un array opcional de roles permitidos para acceder a la ruta.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * @component ProtectedRoute
 * @description Un componente de orden superior (HOC) que protege rutas.
 *              Verifica si el usuario está autenticado y si su rol coincide
 *              con los roles permitidos. Si no, redirige al usuario.
 * @param {ProtectedRouteProps} props - Las propiedades del componente.
 * @returns {JSX.Element | null} Renderiza los componentes hijos si el usuario está autorizado,
 *                               o `null` mientras se realiza la verificación.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  /**
   * @effect
   * @description Realiza la lógica de autorización después de que el componente se monta en el cliente.
   *              Verifica la existencia del usuario y su rol.
   */
  useEffect(() => {
    setReady(true);

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      toast.error("Acceso denegado. No posee los permisos necesarios.");
      router.replace('/dashboard');
      return;
    }

    setAuthorized(true);
  }, [user, allowedRoles, router]);

  // No renderiza nada hasta que la verificación del lado del cliente esté completa y autorizada.
  if (!ready || !authorized) return null;

  return <>{children}</>;
}
