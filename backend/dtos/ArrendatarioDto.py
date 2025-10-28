from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enums.TipoCondicion import TipoCondicion
from util.cuilValidator import validar_cuil_cuit
from dtos.LocalidadDto import LocalidadDtoOut

class ArrendatarioDto(BaseModel):
    razon_social: str
    cuit: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr] = None
    localidad_id: int
    
    @field_validator("mail", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v
    
    @field_validator("cuit")
    @classmethod
    def validar_cuil(cls, v):
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v

class ArrendatarioDtoOut(BaseModel):
    id: int
    razon_social: str
    cuit: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr]
    localidad: LocalidadDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class ArrendatarioDtoModificacion(BaseModel):
    mail: Optional[EmailStr] = None
    razon_social: Optional[str]
    cuit: Optional[str]
    condicion_fiscal: Optional[TipoCondicion]
    localidad_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }