"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { BarChart3, FileDown, Settings, X } from "lucide-react"
import { toast } from "sonner"
import { ReportCard, ReportConfig, ConfigCard } from "@/lib/type"
import { fetchReporte } from "@/lib/reportes/auth"
import { NumberInput } from "@/components/ui/NumberInput"
import { ConfigModal, useConfigModal } from "@/components/ui/ConfigModal"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import RecipientsModal from "@/components/ui/RecipientModal";
import HistorialPagosArrendadorModal from "@/components/ui/HistorialPagosArrendadorModal";

/**
 * @page ReportesPage
 * @description Página central para la generación de reportes y la configuración de tareas programadas.
 *              Permite a los usuarios generar diferentes tipos de informes en PDF o Excel y
 *              ajustar la configuración de notificaciones y procesos automáticos.
 * @returns {JSX.Element} La página de reportes y configuración.
 */
export default function ReportesPage() {
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<{ month?: string; year?: string }>({});
  const [isHistorialPagosArrendadorModalOpen, setIsHistorialPagosArrendadorModalOpen] = useState(false);
  const {isOpen, openModal, closeModal, selectedConfigCard} = useConfigModal();

  // Datos estáticos para las tarjetas de reportes y configuración...

  /**
   * @function handleGenerateReport
   * @description Valida los parámetros y solicita la generación de un reporte a la API.
   *              Maneja la descarga del archivo resultante.
   */
  const handleGenerateReport = async () => {
    // Lógica de validación y generación...
  };

  /**
   * @function handleReportClick
   * @description Abre el modal correspondiente al tipo de reporte seleccionado.
   * @param {string} reportId - El ID del reporte a generar.
   */
  const handleReportClick = (reportId: string) => {
    if (reportId === "historial-pagos-arrendador") {
      setIsHistorialPagosArrendadorModalOpen(true);
    } else {
      setSelectedReport(reportId);
      setIsReportDialogOpen(true);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMINISTRADOR", "OPERADOR"]}>
      <div className="bg-gray-50 p-6">
        <div className="">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-900">Reportes:</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {/* Mapeo de tarjetas de reporte */}
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración de horarios y destinatarios:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mapeo de tarjetas de configuración */}
            </div>
          </div>

          <div className="flex justify-start">
            <Link href="/dashboard" passHref> 
              <button className="btn-secondary px-4 py-2 rounded-md transition-colors">Volver</button>
            </Link>
          </div>

          {/* Modal para parámetros de reporte */}
          {isReportDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* ... Contenido del modal ... */}
              </div>
            </div>
          )}

          <ConfigModal isOpen={isOpen} onClose={closeModal} selectedConfigCard={selectedConfigCard} />
          <RecipientsModal isOpen={isRecipientsModalOpen} onClose={() => setIsRecipientsModalOpen(false)} />
          <HistorialPagosArrendadorModal isOpen={isHistorialPagosArrendadorModalOpen} onClose={() => setIsHistorialPagosArrendadorModalOpen(false)} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
