from datetime import datetime
from backend.model.Arrendamiento import Arrendamiento
from Enums.EstadoPago import EstadoPago
from Enums.TipoOrigenPrecio import TipoOrigenPrecio

class Pago:
    estado: EstadoPago
    quintales: float
    precio_promedio: float
    vencimiento: datetime
    fuente_precio: TipoOrigenPrecio
    monto_a_pago: float
    arrendamiento: Arrendamiento
