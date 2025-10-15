'use client'

import { useAuth } from "@/components/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false); // monta en cliente
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setReady(true);

    if (!user) {
      router.replace('/login');
      return;
    }

    // Si hay allowedRoles y el user no tiene permiso
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      toast.error("Acceso denegado, no posee los permisos necesarios");
      router.replace('/dashboard');
      return;
    }

    setAuthorized(true);
  }, [user, allowedRoles, router]);

  if (!ready || !authorized) return null;

  return <>{children}</>;
}
