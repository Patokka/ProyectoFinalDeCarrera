from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendamientoDto import ArrendamientoDtoOut
from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDtoOut
from enums.EstadoPago import EstadoPago
from enums.TipoOrigenPrecio import TipoOrigenPrecio

class PagoDto(BaseModel):
    quintales: float
    precio_promedio: Optional[float]
    vencimiento: date
    fuente_precio: TipoOrigenPrecio
    monto_a_pagar: Optional[float]
    arrendamiento_id: int
    participacion_arrendador_id: int
    
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