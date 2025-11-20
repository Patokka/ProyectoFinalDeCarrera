from typing import Optional
from pydantic import BaseModel
from dtos.ProvinciaDto import ProvinciaDtoOut

class LocalidadDto(BaseModel):
    """
    DTO para la creación de una localidad.
    Atributos:
        nombre_localidad (str): Nombre de la localidad.
        provincia_id (int): Identificador de la provincia a la que pertenece.
    """
    nombre_localidad: str
    provincia_id: int
    
class LocalidadDtoOut(BaseModel):
    """
    DTO de salida para representar una localidad.
    Atributos:
        id (int): Identificador único de la localidad.
        nombre_localidad (str): Nombre de la localidad.
        provincia (ProvinciaDtoOut): Información de la provincia asociada.
    """
    id: int
    nombre_localidad: str
    provincia: ProvinciaDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class LocalidadDtoModificacion(BaseModel):
    """
    DTO para la modificación de una localidad.
    Atributos:
        nombre_localidad (Optional[str]): Nuevo nombre de la localidad.
        provincia_id (Optional[int]): Nuevo identificador de la provincia.
    """
    nombre_localidad: Optional[str]
    provincia_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }