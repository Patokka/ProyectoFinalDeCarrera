from typing import Optional
from pydantic import BaseModel

class ProvinciaDto(BaseModel):
    """
    DTO para la creación de una provincia.
    Atributos:
        nombre_provincia (str): Nombre de la provincia.
    """
    nombre_provincia:str
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class ProvinciaDtoOut(BaseModel):
    """
    DTO de salida para representar una provincia.
    Atributos:
        id (int): Identificador único de la provincia.
        nombre_provincia (str): Nombre de la provincia.
    """
    id: int
    nombre_provincia:str
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class ProvinciaDtoModificacion(BaseModel):
    """
    DTO para la modificación de una provincia.
    Atributos:
        nombre_provincia (Optional[str]): Nuevo nombre de la provincia.
    """
    nombre_provincia: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }