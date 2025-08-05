from datetime import datetime
from Enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.Pago import Pago

class ConsultaPrecio:
    fecha_consulta: datetime
    precio_promedio: float
    origen: TipoOrigenPrecio
    pago: Pago