from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enums.TipoRol import TipoRol
from util.cuilValidator import validar_cuil_cuit

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
        "from_attributes": True,     
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
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioDtoModificacion(BaseModel):
    nombre: str
    apellido: str
    contrasena: str
    mail: Optional[EmailStr]
    rol: TipoRol
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioLogin(BaseModel):
    cuil: str
    contrasena: str    
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioLogueado(BaseModel):
    nombre: str
    apellido: str
    id: int    
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }