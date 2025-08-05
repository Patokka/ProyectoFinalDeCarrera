from Enums.TipoCondicion import TipoCondicion 
from model.Localidad import Localidad

class Arrendador:
    nombre_o_razon_social: str
    cuil: str
    condicion_fiscal: TipoCondicion
    mail: str
    telefono: str
    descripcion: str
    localidad: Localidad
