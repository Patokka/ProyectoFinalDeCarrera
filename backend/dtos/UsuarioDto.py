from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from backend.enums.TipoCondicion import TipoCondicion
from backend.enums.TipoRol import TipoRol
from backend.util.cuilValidator import validar_cuil_cuit
from backend.dtos.LocalidadDto import LocalidadDtoOut

class UsuarioDto(BaseModel):
    nombre: str
    apellido: str
    contrasena: str
    mail: Optional[EmailStr]
    cuil: str
    rol: TipoRol
    
    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v):
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v
    
    model_config = {
        "use_enum_values": True      
    }
    
class UsuarioDtoOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    mail: Optional[EmailStr]
    cuil: str
    rol: TipoRol
    
    model_config = {
        "use_enum_values": True      
    }

class UsuarioDtoModificacion(BaseModel):
    nombre: str
    apellido: str
    contrasena: str
    mail: Optional[EmailStr]
    rol: TipoRol
    
    model_config = {     
        "use_enum_values": True      
    }