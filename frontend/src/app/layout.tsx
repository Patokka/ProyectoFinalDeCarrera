
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SideBar from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/context/AuthContext";

export const metadata: Metadata = {
  title: "Sistema de Gestión de Arrendamientos",
  description: "Sistema para gestionar arrendamientos rurales",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-slate-200">
            <Navbar/>
            <main className="pt-16">
              <SideBar>
                {children}
              </SideBar>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
