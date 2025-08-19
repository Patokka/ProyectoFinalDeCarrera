from pydantic import BaseModel

class ConfiguracionDtoModificacion(BaseModel):
    clave: str
    valor: str