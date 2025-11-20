from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enums.TipoRol import TipoRol
from util.cuilValidator import validar_cuil_cuit

class UsuarioDto(BaseModel):
    """
    DTO para la creación de un usuario.
    Atributos:
        nombre (str): Nombre del usuario.
        apellido (str): Apellido del usuario.
        contrasena (str): Contraseña del usuario.
        mail (Optional[EmailStr]): Correo electrónico.
        cuil (str): CUIL del usuario.
        rol (TipoRol): Rol asignado al usuario.
    """
    nombre: str
    apellido: str
    contrasena: str
    mail: Optional[EmailStr] = None
    cuil: str
    rol: TipoRol
    
    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v):
        """
        Valida el formato del CUIL.
        Args:
            v (str): CUIL a validar.
        Returns:
            str: CUIL validado.
        Raises:
            ValueError: Si el CUIL es inválido.
        """
        if not validar_cuil_cuit(v):
            raise ValueError("CUIL/CUIT inválido.")
        return v
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioDtoOut(BaseModel):
    """
    DTO de salida para representar un usuario.
    Atributos:
        id (int): Identificador único del usuario.
        nombre (str): Nombre del usuario.
        apellido (str): Apellido del usuario.
        mail (Optional[EmailStr]): Correo electrónico.
        cuil (str): CUIL del usuario.
        rol (TipoRol): Rol del usuario.
    """
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
    """
    DTO para la modificación de contraseña de un usuario.
    Atributos:
        contrasenaActual (str): Contraseña actual del usuario.
        contrasenaNueva (str): Nueva contraseña deseada.
    """
    contrasenaActual: str
    contrasenaNueva: str
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioLogin(BaseModel):
    """
    DTO para el inicio de sesión de un usuario.
    Atributos:
        cuil (str): CUIL del usuario.
        contrasena (str): Contraseña del usuario.
    """
    cuil: str
    contrasena: str    
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class UsuarioLogueado(BaseModel):
    """
    DTO para representar un usuario logueado.
    Atributos:
        nombre (str): Nombre del usuario.
        apellido (str): Apellido del usuario.
        id (int): Identificador único del usuario.
        rol (TipoRol): Rol del usuario.
    """
    nombre: str
    apellido: str
    id: int 
    rol: TipoRol   
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }