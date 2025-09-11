export interface PaymentSummaryResponse {
  arrendatario: string
  cantidad: number
  monto: number
}

export interface LocalidadDtoOut {
  id: number;
  nombre: string;
  provincia: {
    id: number;
    nombre: string;
  };
}

export interface UsuarioDtoOut {
  id: number;
  cuil: string;
  nombre: string;
  apellido: string;
  mail?: string;
  rol: string;
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
  localidad: LocalidadDtoOut;
  descripcion?: string;
}

export type EstadoArrendamiento = "ACTIVO" | "FINALIZADO" | "CANCELADO" | "VENCIDO"; 
export type TipoArrendamiento = "FIJO" | "A_PORCENTAJE"; 
export type PlazoPago = "ANUAL" | "SEMESTRAL" | "CUATRIMESTRAL" | "TRIMESTRAL" | "BIMESTRAL" | "MENSUAL"; 
export type TipoDiasPromedio = "ULTIMOS_5_HABILES" | "ULTIMOS_10_HABILES" | "ULTIMO_MES" | "DEL_10_AL_15_MES_ACTUAL"; 
export type TipoOrigenPrecio = "BCR" | "AGD";

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