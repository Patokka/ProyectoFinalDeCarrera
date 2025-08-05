from datetime import datetime
from backend.model.Arrendador import Arrendador
from backend.model.Pago import Pago

class Facturacion:
    fecha_facturacion: datetime
    monto_facturacion: float
    arrendador: Arrendador
    pago: Pago