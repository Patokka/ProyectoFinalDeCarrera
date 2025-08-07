from typing import Optional
from pydantic import BaseModel

class ProvinciaDto(BaseModel):
    nombre_provincia:str
    
class ProvinciaDtoOut(BaseModel):
    id: int
    nombre_provincia:str

class ProvinciaDtoModificacion(BaseModel):
    nombre_provincia: Optional[str]