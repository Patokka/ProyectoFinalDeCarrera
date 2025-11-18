
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SideBar from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/context/AuthContext";
import { Toaster } from 'sonner'

/**
 * @constant metadata
 * @description Metadatos de la aplicación para SEO y configuración del navegador.
 * @property {string} title - El título principal de la aplicación.
 * @property {string} description - Una breve descripción del propósito de la aplicación.
 * @property {object} icons - Define los íconos de la aplicación, como el favicon.
 */
export const metadata: Metadata = {
  title: "Sistema de Gestión de Arrendamientos",
  description: "Sistema para gestionar arrendamientos rurales",
  icons: {
    icon: '/favicon.ico',
  },
};

/**
 * @component RootLayout
 * @description El componente de diseño principal que envuelve toda la aplicación.
 *              Incluye el proveedor de autenticación, la barra de navegación, la barra lateral
 *              y el sistema de notificaciones.
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - Los componentes hijos que serán renderizados dentro de este diseño.
 * @returns {JSX.Element} El diseño raíz de la aplicación.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <div className="bg-slate-200">
            <Navbar/>
            <main className="pt-16">
              <SideBar>
                {children}
                <Toaster richColors position="top-center" />
              </SideBar>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
