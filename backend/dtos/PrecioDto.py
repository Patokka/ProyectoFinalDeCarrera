from datetime import date
from typing import Optional
from pydantic import BaseModel
from backend.dtos.ConsultaPrecioDto import ConsultaPrecioDtoOut
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio


class PrecioDto(BaseModel):
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio
    consulta_precio_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PrecioDtoOut(BaseModel):
    id: int
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio
    consulta_precio: Optional[ConsultaPrecioDtoOut]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }

class PrecioDtoModificacion(BaseModel):
    fecha_precio: Optional[date]
    precio_obtenido: Optional[float]
    origen: Optional[TipoOrigenPrecio]
    consulta_precio_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }