from datetime import datetime
from backend.model.Arrendador import Arrendador
from backend.model.Facturacion import Facturacion

class Retencion:
    fecha_retencion: datetime
    minimo_imponible: float
    total_retencion: float
    arrendador: Arrendador
    facturacion: Facturacion