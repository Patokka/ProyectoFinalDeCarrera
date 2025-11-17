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

const reportConfigs: Record<string, ReportConfig> = {
  "pagos-realizados": {
    id: "pagos-realizados",
    endpoint: "/api/reportes/mensual/pdf",
    fileType: "pdf",
    inputFields: ["month", "year"],
  },
  "pagos-realizar": {
    id: "pagos-realizar",
    endpoint: "/api/reportes/pagos-pendientes/pdf",
    fileType: "pdf",
    inputFields: ["month", "year"],
  },
  "facturaciones": {
    id: "facturaciones",
    endpoint: "/api/reportes/facturacion/excel",
    fileType: "excel",
    inputFields: ["month", "year"],
  },
  
};

const reportCards: ReportCard[] = [
  {
    id: "pagos-realizados",
    title: "Reporte de Pagos Realizados",
    description: "Hasta el mes actual",
    icon: BarChart3,
    fileType: "pdf",
    endpoint: "/api/reportes/mensual/pdf",
    inputFields: [
      {
        id: "anio",
        label: "Año",
        type: "number",
        placeholder: "Ej: 2024",
        min: 2000,
        max: 2050,
        required: true,
      },
      {
        id: "mes",
        label: "Mes",
        type: "number",
        placeholder: "Ej: 09",
        min: 1,
        max: 12,
        required: true,
      },
    ],
  },
  {
    id: "pagos-realizar",
    title: "Reporte de Pagos a Realizar",
    description: "Para el mes actual o futuro",
    icon: BarChart3,
    fileType: "pdf",
    endpoint: "/api/reportes/pagos-pendientes/pdf",
    inputFields: [
      {
        id: "anio",
        label: "Año",
        type: "number",
        placeholder: "Ej: 2024",
        min: 2000,
        max: 2050,
        required: true,
      },
      {
        id: "mes",
        label: "Mes",
        type: "number",
        placeholder: "Ej: 10",
        min: 1,
        max: 12,
        required: true,
      },
    ],
  },
  {
    id: "facturaciones",
    title: "Reporte de Facturación Fiscal",
    description: "12 meses desde la fecha seleccionada",
    icon: BarChart3,
    fileType: "excel",
    endpoint: "/api/reportes/facturacion/excel",
    inputFields: [
      {
        id: "anio_inicio",
        label: "Año de inicio",
        type: "number",
        placeholder: "Ej: 2024",
        min: 2000,
        max: 2050,
        required: true,
      },
      {
        id: "mes_inicio",
        label: "Mes de inicio",
        type: "number",
        placeholder: "Ej: 09",
        min: 1,
        max: 12,
        required: true,
      },
    ],
  },
  {
    id: "historial-pagos-arrendador",
    title: "Reporte historial de pagos de arrendador",
    description: "Historial de pagos por rango de fechas y arrendador",
    icon: BarChart3,
    fileType: "pdf",
    endpoint: "/api/reportes/historial-pagos-arrendador/pdf",
    inputFields: [],
  },
];

const configurationCards: ConfigCard[] = [
  {
    id: "boleta-comercio",
    title: "Configurar hora de consulta de precio a Bolsa de Comercio de Rosario",
    description: "Se realiza de manera diaria para obtener el precio de la tonelada de soja",
    icon: Settings,
    type: "time",
    jobId: "precio_diario_bcr",
  },
  {
    id: "pagos-vencidos",
    title: "Configurar hora de actualización de pagos Vencidos",
    description: "Se verifica diariamente aquellos pagos que no han sido facturados",
    icon: Settings,
    type: "time",
    jobId:"actualizar_pagos_vencidos"
  },
  {
    id: "precios-soja",
    title: "Configurar día y hora de actualización de precios de pagos",
    description: "Utilizando los precios almacenados, se calcula el monto a pagar de los pagos del mes",
    icon: Settings,
    type: "schedule",
    jobId: "actualizar_precios_pagos_mensuales"
  },
  {
    id: "reporte-pagos",
    title: "Configurar día y hora de envío de reporte de pagos a realizar en el mes",
    description: "Configurar frecuencia de envío de reportes",
    icon: Settings,
    type: "schedule",
    jobId:"enviar_reportes_pagos_pendientes_mes"
  },
  {
    id: "vencimientos",
    title: "Configurar hora de actualización de Arrendamientos vencidos",
    description: "Se verifica diariamente el estado de los arrendamientos arrendamientos",
    icon: Settings,
    type: "frequency",
    jobId: "actualizar_arrendamientos_vencidos"
  },
  {
    id: "destinatarios-reportes",
    title: "Configurar destinatarios de reportes automáticos",
    description: "Editar, agregar o eliminar los correos que recibirán los reportes por email",
    icon: Settings,
    type: "recipients",
    jobId: "configurar_destinatarios_reportes"
  },
]

export default function ReportesPage() {
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<{ month?: string; year?: string }>({});
  const [isHistorialPagosArrendadorModalOpen, setIsHistorialPagosArrendadorModalOpen,] = useState(false);
  // Configuration form states
  const {isOpen, openModal, closeModal, selectedConfigCard, configTime, setConfigTime, configDay, setConfigDay, isSubmitting, setIsSubmitting, isDeactivated, setIsDeactivated } = useConfigModal();   
  const handleGenerateReport = async () => {
    if (!selectedReport) return;
    const reportConfig = reportConfigs[selectedReport];
    if (!reportConfig) return;
    const { endpoint, fileType } = reportConfig;
    const newErrors: { month?: string; year?: string } = {};
    // VALIDACIONES DE CAMPOS VACÍOS
    if (!month) {
      newErrors.month = "Debe completar el mes";
      toast.error("Debe completar el mes");
    }
    if (!year) {
      newErrors.year = "Debe completar el año";
      toast.error("Debe completar el año");
    }
    if(parseInt(month,10) > 12 || parseInt(month,10) < 1) {
      newErrors.month = "Ingrese un mes válido";
      toast.error("Ingrese un mes válido.");
    }
    if(parseInt(year,10) < 2020 || parseInt(year,10) > 2100) {
      newErrors.year = "Año fuera de rango (2020 - 2100)";
      toast.error("Año fuera de rango (2020 - 2100).");
    }
    const mes = parseInt(month, 10);
    const anio = parseInt(year, 10);
    const hoy = new Date();
    const actualMes = hoy.getMonth() + 1;
    const actualAnio = hoy.getFullYear();
    // VALIDACIÓN SEGÚN REPORTE
    if (selectedReport === "pagos-realizados") {
      if (anio > actualAnio || (anio === actualAnio && mes > actualMes)) {
        newErrors.month = `Solo se pueden generar reportes hasta ${String(actualMes).padStart(2,"0")}-${actualAnio}`;
        toast.error(`Solo se pueden generar reportes hasta ${String(actualMes ).padStart(2, "0")}-${actualAnio}.`);
      }
    }
    if (selectedReport === "pagos-realizar") {
      if (anio < actualAnio || (anio === actualAnio && mes < actualMes)) {
        newErrors.month = `Solo se pueden generar reportes del mes actual (${String(actualMes).padStart(2,"0")}-${actualAnio}) o futuro.`;
        toast.error(`Solo se pueden generar reportes del mes actual (${String(actualMes).padStart(2, "0")}-${actualAnio}) o futuro.`);
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      setIsGenerating(true);
      const { blob, filename } = await fetchReporte(endpoint, { mes: month, anio: year });      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte generado con éxito");
      setMonth("")
      setYear("")
      setErrors({})
      setIsReportDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al generar el reporte";
      toast.error(message);
    } finally{
      setIsGenerating(false);
    }
  };

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
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-900">Reportes:</h1>
          </div>

          {/* Tarjetas de reporte, similares al dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {reportCards.map((report) => {
              const Icon = report.icon
              return (
                <div
                  key={report.id}
                  onClick={() => handleReportClick(report.id)}
                  className="bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-green-300 rounded-lg flex items-center justify-center">
                      <Icon className="w-8 h-8 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{report.title}</h3>
                      {report.description && <p className="text-sm text-gray-600">{report.description}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sección de Configuración */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración de horarios y destinatarios:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurationCards.map((config) => {
            const Icon = config.icon;
            return (
              <div
                key={config.id}
                onClick={() => {
                  if (config.type === "recipients") {
                    setIsRecipientsModalOpen(true);
                  } else {
                    openModal(config);
                  }
                }}
                className="bg-white border border-gray-300 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center space-x-3 text-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{config.title}</h3>
                    <p className="text-xs text-gray-600">{config.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

          {/* Botón Volver */}
          <div className="flex justify-start">
            <Link href="/dashboard" passHref> 
              <button className="btn-secondary px-4 py-2 rounded-md transition-colors">
                Volver
              </button>
            </Link>
          </div>

          {/* Sección  de parámetros de reporte Pop-Up*/}
          {isReportDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Parámetros del Reporte
                  </h3>
                  <button
                    onClick={() => {setIsReportDialogOpen(false); setMonth(""); setYear(""); setErrors({})}}
                    className={`text-gray-400 hover:text-gray-600 transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isGenerating}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cuerpo dinámico */}
                <div className="p-6 space-y-4">
                  {/* Común: Mes */}
                  <div className="space-y-2">
                    <NumberInput
                      label="Mes"
                      value={month ? parseInt(month) : undefined}
                      onChange={(val) => setMonth(val ? val.toString().padStart(2, '0') : "")}
                      min={1}
                      max={12}
                      placeholder="Ej: 09"
                      step={1}
                      error={errors.month}
                    />
                  </div>

                  {/* Común: Año */}
                  <div className="space-y-2">
                    <NumberInput
                      label="Año"
                      value={year ? parseInt(year) : undefined}
                      onChange={(val) => setYear(val ? val.toString() : "")}
                      min={2020}
                      max={2100}
                      step={1}
                      placeholder="Ej: 2025"
                      error={errors.year}
                    />
                  </div>

                  {/* Extra info  */}
                  {selectedReport === "facturaciones" && (
                    <div className="text-xs text-center text-blue-800 leading-snug">
                      Se generará un reporte fiscal anual desde el mes/año seleccionado.
                      Ej: Para generar reporte del 10/2024 al 09/2025 ingresar 10/2024 en los campos.
                    </div>
                  )}
                  {selectedReport === "pagos-realizados" && (
                    <p className="text-xs text-center text-blue-800 leading-snug">
                      Solo se permiten reportes hasta el mes actual.
                    </p>
                  )}
                  {selectedReport === "pagos-realizar" && (
                    <p className="text-xs text-center text-blue-800 leading-snug">
                      Solo se permiten reportes del mes actual o futuro.
                    </p>
                  )}
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
                  <button
                    onClick={() => {setIsReportDialogOpen(false); setMonth(""); setYear(""); setErrors({})  }}
                    className={`btn-secondary px-4 py-2 rounded-md transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""} `}
                    disabled={isGenerating}
                  >
                    Cancelar
                  </button>                 
                    <button
                      onClick={handleGenerateReport}
                      className={`btn-primary px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${isGenerating ? "opacity-50 cursor-not-allowed" : ""} pl-2`}
                      disabled={isGenerating}
                    >
                    <FileDown className="h-5 w-5"/>
                    <span>{isGenerating ? "Generando..." : "Generar Reporte"}</span>
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de horarios - Pop-Up*/}
          <ConfigModal
            isOpen={isOpen}
            onClose={closeModal}
            selectedConfigCard={selectedConfigCard}
            configTime={configTime}
            setConfigTime={setConfigTime}
            configDay={configDay}
            setConfigDay={setConfigDay}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            isDeactivated={isDeactivated}
            setIsDeactivated={setIsDeactivated}
          />
          <RecipientsModal
            isOpen={isRecipientsModalOpen}
            onClose={() => setIsRecipientsModalOpen(false)}
          />
          <HistorialPagosArrendadorModal
            isOpen={isHistorialPagosArrendadorModalOpen}
            onClose={() => setIsHistorialPagosArrendadorModalOpen(false)}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
