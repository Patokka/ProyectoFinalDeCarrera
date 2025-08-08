from typing import Optional
from pydantic import BaseModel
from backend.dtos.ProvinciaDto import ProvinciaDtoOut

class LocalidadDto(BaseModel):
    nombre_localidad: str
    provincia_id: int
    
class LocalidadDtoOut(BaseModel):
    id: int
    nombre_localidad: str
    provincia: ProvinciaDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class LocalidadDtoModificacion(BaseModel):
    nombre_localidad: Optional[str]
    provincia_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }