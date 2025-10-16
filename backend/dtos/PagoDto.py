from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendamientoDto import ArrendamientoDtoOut
from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDtoOut
from enums.EstadoPago import EstadoPago
from enums.TipoOrigenPrecio import TipoOrigenPrecio
from enums.TipoDiasPromedio import TipoDiasPromedio

class PagoDto(BaseModel):
    quintales: Optional[float]
    vencimiento: date
    fuente_precio: TipoOrigenPrecio
    arrendamiento_id: int
    participacion_arrendador_id: int
    porcentaje: Optional[float]
    dias_promedio: Optional[TipoDiasPromedio]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PagoDtoOut(BaseModel):
    id: int
    estado: EstadoPago
    quintales: Optional[float]
    precio_promedio: Optional[float]
    vencimiento: date
    fuente_precio: Optional[TipoOrigenPrecio] = None
    monto_a_pagar: Optional[float]
    arrendamiento: ArrendamientoDtoOut
    participacion_arrendador: ParticipacionArrendadorDtoOut
    porcentaje: Optional[float]
    dias_promedio: Optional[TipoDiasPromedio]
    
    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }
    
class PagoDtoModificacion(BaseModel):
    estado: Optional[EstadoPago]
    quintales: Optional[float]
    precio_promedio: Optional[float]
    vencimiento: Optional[date]
    fuente_precio: Optional[TipoOrigenPrecio]
    monto_a_pagar: Optional[float]
    
    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }
    
class PagoResumenDto(BaseModel):
    arrendatario: str
    cantidad: int
    monto: float
    
class PagoFechaEstado(BaseModel):
    fecha: str
    estado: str