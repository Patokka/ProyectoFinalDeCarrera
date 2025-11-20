from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enums.TipoCondicion import TipoCondicion
from util.cuilValidator import validar_cuil_cuit
from dtos.LocalidadDto import LocalidadDtoOut

class ArrendadorDto(BaseModel):
    """
    DTO para la creación o actualización de un arrendador.
    
    Atributos:
        nombre_o_razon_social (str): Nombre o razón social del arrendador.
        cuil (str): Clave Única de Identificación Laboral/Tributaria.
        condicion_fiscal (TipoCondicion): Condición fiscal del arrendador.
        mail (Optional[EmailStr]): Correo electrónico del arrendador. Puede ser nulo.
        telefono (Optional[str]): Número de teléfono del arrendador.
        localidad_id (int): Identificador de la localidad asociada.
        descripcion (Optional[str]): Descripción adicional del arrendador.
    """
    nombre_o_razon_social: str
    cuil: str
    condicion_fiscal: TipoCondicion
    mail: Optional[EmailStr] = None
    telefono: Optional[str]
    localidad_id: int
    descripcion: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }
    
    @field_validator("mail", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        """
        Convierte una cadena vacía a None para el campo mail.
        Args:
            v (str | None): El valor del campo mail.
        Returns:
            str | None: El valor original o None si era una cadena vacía.
        """
        if v == "":
            return None
        return v
    
    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v):
        """
        Valida que el CUIL/CUIT tenga un formato correcto.
        Args:
            v (str): El CUIL/CUIT a validar.
        Returns:
            str: El CUIL/CUIT validado.
        Raises:
            ValueError: Si el CUIL/CUIT es inválido.
        """
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v
    
class ArrendadorDtoOut(BaseModel):
    """
    DTO de salida para representar un arrendador.
    Atributos:
        id (int): Identificador único del arrendador.
        nombre_o_razon_social (str): Nombre o razón social del arrendador.
        cuil (str): Clave Única de Identificación Laboral/Tributaria.
        condicion_fiscal (TipoCondicion): Condición fiscal del arrendador.
        mail (Optional[EmailStr]): Correo electrónico del arrendador.
        telefono (Optional[str]): Número de teléfono del arrendador.
        localidad (LocalidadDtoOut): Objeto DTO con información de la localidad.
        descripcion (Optional[str]): Descripción adicional del arrendador.
    """
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
    """
    DTO para la modificación parcial de un arrendador.
    Atributos:
        nombre_o_razon_social (Optional[str]): Nombre o razón social del arrendador.
        cuil (Optional[str]): Clave Única de Identificación Laboral/Tributaria.
        condicion_fiscal (Optional[TipoCondicion]): Condición fiscal del arrendador.
        mail (Optional[EmailStr]): Correo electrónico del arrendador.
        telefono (Optional[str]): Número de teléfono del arrendador.
        localidad_id (Optional[int]): Identificador de la localidad asociada.
        descripcion (Optional[str]): Descripción adicional del arrendador.
    """
    nombre_o_razon_social: Optional[str]
    cuil: Optional[str]
    condicion_fiscal: Optional[TipoCondicion]
    mail: Optional[EmailStr] = None
    telefono: Optional[str]
    localidad_id: Optional[int]
    descripcion: Optional[str]
    
    model_config = {     
        "from_attributes": True,     
        "use_enum_values": True         
    }