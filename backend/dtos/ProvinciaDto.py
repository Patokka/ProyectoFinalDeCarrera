from typing import Optional
from pydantic import BaseModel

class ProvinciaDto(BaseModel):
    nombre_provincia:str
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class ProvinciaDtoOut(BaseModel):
    id: int
    nombre_provincia:str
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class ProvinciaDtoModificacion(BaseModel):
    nombre_provincia: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }