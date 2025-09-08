from datetime import date
from typing import Optional
from pydantic import BaseModel
from enums.TipoOrigenPrecio import TipoOrigenPrecio


class PrecioDto(BaseModel):
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio

    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PrecioDtoOut(BaseModel):
    id: int
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }

class PrecioDtoModificacion(BaseModel):
    fecha_precio: Optional[date]
    precio_obtenido: Optional[float]
    origen: Optional[TipoOrigenPrecio]

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }