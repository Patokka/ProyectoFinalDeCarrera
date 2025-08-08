from enum import Enum

class EstadoPago(Enum):
    PENDIENTE = "PENDIENTE"
    REALIZADO = "REALIZADO"
    VENCIDO = "VENCIDO"
    CANCELADO = "CANCELADO"