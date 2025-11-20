from datetime import date
from typing import Optional
from pydantic import BaseModel
from enums.TipoOrigenPrecio import TipoOrigenPrecio


class PrecioDto(BaseModel):
    """
    DTO para la creación de un precio.
    Atributos:
        fecha_precio (date): Fecha del precio.
        precio_obtenido (float): Valor del precio obtenido.
        origen (TipoOrigenPrecio): Origen de la información del precio.
    """
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PrecioDtoOut(BaseModel):
    """
    DTO de salida para representar un precio.
    Atributos:
        id (int): Identificador único del precio.
        fecha_precio (date): Fecha del precio.
        precio_obtenido (float): Valor del precio.
        origen (TipoOrigenPrecio): Origen del precio.
    """
    id: int
    fecha_precio: date
    precio_obtenido: float
    origen: TipoOrigenPrecio
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }

class PrecioDtoModificacion(BaseModel):
    """
    DTO para la modificación de un precio.
    Atributos:
        fecha_precio (Optional[date]): Nueva fecha del precio.
        precio_obtenido (Optional[float]): Nuevo valor del precio.
        origen (Optional[TipoOrigenPrecio]): Nuevo origen del precio.
    """
    fecha_precio: Optional[date]
    precio_obtenido: Optional[float]
    origen: Optional[TipoOrigenPrecio]

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }