from datetime import datetime
from Enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.ConsultaPrecio import ConsultaPrecio

class Precio:
    fecha_precio: datetime
    precio_obtenido: float
    origen: TipoOrigenPrecio
    consulta_precio: ConsultaPrecio
