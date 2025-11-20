from pydantic import BaseModel

class ConfiguracionDtoModificacion(BaseModel):
    """
    DTO para la modificación de una configuración del sistema.
    Atributos:
        clave (str): La clave de configuración a modificar.
        valor (str): El nuevo valor para la clave.
    """
    clave: str
    valor: str