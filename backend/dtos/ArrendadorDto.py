from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from backend.enums.TipoCondicion import TipoCondicion
from backend.util.cuilValidator import validar_cuil_cuit
from backend.dtos.LocalidadDto import LocalidadDtoOut

class ArrendadorDto(BaseModel):
    nombre_o_razon_social: str
    cuil: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr]
    telefono: Optional[str]
    localidad_id: int
    descripcion: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }
    
    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v):
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v
    
class ArrendadorDtoOut(BaseModel):
    id: int
    nombre_o_razon_social: str
    cuil: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr]
    telefono: Optional[str]
    localidad: LocalidadDtoOut
    descripcion: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }

class ArrendadorDtoModificacion(BaseModel):
    condicion_fiscal: Optional[TipoCondicion]
    mail: Optional[EmailStr]
    telefono: Optional[str]
    localidad_id: Optional[int]
    descripcion: Optional[str]
    
    model_config = {     
        "from_attributes": True,     
        "use_enum_values": True         
    }