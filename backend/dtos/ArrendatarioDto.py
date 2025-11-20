from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enums.TipoCondicion import TipoCondicion
from util.cuilValidator import validar_cuil_cuit
from dtos.LocalidadDto import LocalidadDtoOut

class ArrendatarioDto(BaseModel):
    """
    DTO para la creación de un arrendatario.
    Atributos:
        razon_social (str): Razón social del arrendatario.
        cuit (str): CUIT del arrendatario.
        condicion_fiscal (TipoCondicion): Condición fiscal.
        mail (Optional[EmailStr]): Correo electrónico.
        localidad_id (int): Identificador de la localidad.
    """
    razon_social: str
    cuit: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr] = None
    localidad_id: int
    
    @field_validator("mail", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        """
        Convierte cadenas vacías a None para el campo mail.
        Args:
            v (str | None): Valor del mail.
        Returns:
            str | None: Valor del mail o None.
        """
        if v == "":
            return None
        return v
    
    @field_validator("cuit")
    @classmethod
    def validar_cuil(cls, v):
        """
        Valida el formato del CUIT.
        Args:
            v (str): CUIT a validar.
        Returns:
            str: CUIT validado.
        Raises:
            ValueError: Si el CUIT es inválido.
        """
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v

class ArrendatarioDtoOut(BaseModel):
    """
    DTO de salida para representar un arrendatario.
    Atributos:
        id (int): Identificador único del arrendatario.
        razon_social (str): Razón social.
        cuit (str): CUIT.
        condicion_fiscal (TipoCondicion): Condición fiscal.
        mail (Optional[EmailStr]): Correo electrónico.
        localidad (LocalidadDtoOut): Información de la localidad.
    """
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
    """
    DTO para la modificación de un arrendatario.
    Atributos:
        mail (Optional[EmailStr]): Nuevo correo electrónico.
        razon_social (Optional[str]): Nueva razón social.
        cuit (Optional[str]): Nuevo CUIT.
        condicion_fiscal (Optional[TipoCondicion]): Nueva condición fiscal.
        localidad_id (Optional[int]): Nuevo identificador de localidad.
    """
    mail: Optional[EmailStr] = None
    razon_social: Optional[str]
    cuit: Optional[str]
    condicion_fiscal: Optional[TipoCondicion]
    localidad_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }