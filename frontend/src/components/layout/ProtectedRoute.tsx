'use client'

import { useAuth } from "@/components/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // marca que estamos en el cliente
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace('/login'); // redirige si no hay usuario
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return null; // espera hasta que client esté listo
  }

  return <>{children}</>;
}
