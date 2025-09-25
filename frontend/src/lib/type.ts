export interface ReportConfig {
  id: string;
  endpoint: string;
  fileType: "pdf" | "excel";
  inputFields: Array<"month" | "year">;
}

export interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputFields: Array<{
    id: string;
    label: string;
    type: "number";
    placeholder?: string;
    min?: number;
    max?: number;
    required?: boolean;
  }>;
  endpoint: string;
  fileType: "pdf" | "excel";
}

export interface ConfigCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  type: "time" | "frequency" | "schedule"
  jobId: string
}

export interface PaymentSummaryResponse {
  arrendatario: string
  cantidad: number
  monto: number
}

export interface Option{
  label:string;
  value: string;
}

export interface ProvinciaDtoOut{
  id: number;
  nombre_provincia: string;
}

export interface LocalidadDtoOut {
  id: number;
  nombre_localidad: string;
  provincia: ProvinciaDtoOut;
}

export type TipoRol = "ADMINISTRADOR" | "OPERADOR" | "CONSULTA";


export interface UsuarioDtoOut {
  id: number;
  cuil: string;
  nombre: string;
  apellido: string;
  mail?: string;
  rol: TipoRol;
}

export type TipoCondicion = "RESPONSABLE_INSCRIPTO" | "RESPONSABLE_NO_INSCRIPTO_O_EXENTO" | "MONOTRIBUTISTA"; 

export interface ArrendatarioDtoOut {
  id: number;
  razon_social: string;
  condicion_fiscal: TipoCondicion;
  cuit: string;
  mail: string;
  localidad: LocalidadDtoOut;
}

export interface ArrendadorDtoOut {
  id: number;
  nombre_o_razon_social: string;
  cuil:string;
  condicion_fiscal: TipoCondicion;
  mail?: string;
  telefono?: string;
  localidad: LocalidadDtoOut;
  descripcion?: string;
}

export type TipoFactura = "A" | "B" | "C";
export type EstadoArrendamiento = "ACTIVO" | "FINALIZADO" | "CANCELADO" | "VENCIDO"; 
export type TipoArrendamiento = "FIJO" | "A_PORCENTAJE"; 
export type PlazoPago = "ANUAL" | "SEMESTRAL" | "CUATRIMESTRAL" | "TRIMESTRAL" | "BIMESTRAL" | "MENSUAL"; 
export type TipoDiasPromedio = "ULTIMOS_5_HABILES" | "ULTIMOS_10_HABILES" | "ULTIMO_MES" | "DEL_10_AL_15_MES_ACTUAL"; 
export type TipoOrigenPrecio = "BCR" | "AGD";
export type EstadoPago = "PENDIENTE" | "REALIZADO" | "VENCIDO" | "CANCELADO"

export interface ArrendamientoDtoOut {
  id: number;
  estado: EstadoArrendamiento;
  tipo: TipoArrendamiento;
  localidad: LocalidadDtoOut;
  usuario: UsuarioDtoOut;
  arrendatario: ArrendatarioDtoOut;
  fecha_inicio: string; 
  fecha_fin: string;
  quintales: number;
  hectareas: number;
  plazo_pago: PlazoPago;
  dias_promedio: TipoDiasPromedio;
  origen_precio: TipoOrigenPrecio;
  porcentaje_aparceria?: number;
  descripcion?: string;
  arrendadores: ArrendadorDtoOut[];
}

export interface ParticipacionArrendador {
  arrendador_id: number;
  hectareas_asignadas: number;
  quintales_asignados: number;
  porcentaje: number;
  observacion?: string;
  arrendamiento_id?: number;
}

export type ArrendamientoForm = {
  tipo: TipoArrendamiento;
  localidad_id: number;
  usuario_id: number;
  arrendatario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  quintales: number;
  hectareas: number;
  plazo_pago: PlazoPago
  dias_promedio: TipoDiasPromedio;
  origen_precio: TipoOrigenPrecio;
  porcentaje_aparceria: number;
  descripcion: string;
};

export interface PagoDtoOut {
  id: number;
  estado: EstadoPago;
  quintales?: number;
  precio_promedio?: number;
  vencimiento: string;
  fuente_precio?: TipoOrigenPrecio;
  monto_a_pagar?: number;
  arrendamiento: ArrendamientoDtoOut;
  participacion_arrendador: ParticipacionArrendador
}

export interface PrecioDtoOut{
  id: number;
  fecha_precio: string;
  precio_obtenido: number;
  origen: TipoOrigenPrecio;
}

export interface FacturacionDtoOut{
  id: number;
  fecha_facturacion: string;
  tipo_factura: TipoFactura;
  monto_facturacion: number;
  arrendador: ArrendadorDtoOut;
  pago: PagoDtoOut;
}

export interface RetencionDtoOut {
    id: number;
    fecha_retencion: string;
    monto_imponible: number;
    total_retencion: number;
    arrendador: ArrendadorDtoOut;
    facturacion: FacturacionDtoOut;
}