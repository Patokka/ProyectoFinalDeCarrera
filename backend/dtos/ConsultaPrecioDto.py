from datetime import date
from typing import Optional
from pydantic import BaseModel
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.dtos.PagoDto import PagoDtoOut

class ConsultaPrecioDto(BaseModel):
    fecha_consulta: date
    precio_promedio: float
    origen: TipoOrigenPrecio
    pago_id: int

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class ConsultaPrecioDtoOut(BaseModel):
    id: int
    fecha_consulta: date
    precio_promedio: float
    origen: TipoOrigenPrecio
    pago: PagoDtoOut
    
    model_config = {
        "from_attributes": True,   
        "use_enum_values": True      
    }

class ConsultaPrecioDtoModificacion(BaseModel):
    precio_promedio: Optional[float]
    origen: TipoOrigenPrecio

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }