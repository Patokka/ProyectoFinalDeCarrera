from enum import Enum

class EstadoPago(Enum):
    PENDIENTE = "Pendiente"
    REALIZADO = "Realizado"
    VENCIDO = "Vencido"
    CANCELADO = "Cancelado"