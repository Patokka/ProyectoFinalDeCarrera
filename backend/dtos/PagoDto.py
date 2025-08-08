from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.dtos.ArrendamientoDto import ArrendamientoDtoOut
from backend.enums.EstadoPago import EstadoPago
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio

class PagoDto(BaseModel):
    quintales: float
    precio_promedio: Optional[float]
    vencimiento: datetime
    monto_a_pagar: Optional[float]
    arrendamiento_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PagoDtoOut(BaseModel):
    id: int
    estado: EstadoPago
    quintales: float
    precio_promedio: Optional[float]
    vencimiento: datetime
    fuente_precio: TipoOrigenPrecio
    monto_a_pagar: Optional[float]
    arrendamiento: ArrendamientoDtoOut
    
    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }
    
class PagoDtoModificacion(BaseModel):
    estado: Optional[EstadoPago]
    quintales: Optional[float]
    precio_promedio: Optional[float]
    vencimiento: Optional[datetime]
    fuente_precio: Optional[TipoOrigenPrecio]
    monto_a_pagar: Optional[float]
    
    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }