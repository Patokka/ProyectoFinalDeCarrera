from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.util.database import Base
from backend.enums.EstadoPago import EstadoPago
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.Arrendamiento import Arrendamiento


class Pago(Base):
    __tablename__ = "pago"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    estado: Mapped[EstadoPago] = mapped_column(Enum(EstadoPago), nullable=False, default=EstadoPago.PENDIENTE)
    quintales: Mapped[float] = mapped_column(nullable=False)
    precio_promedio: Mapped[float] = mapped_column(nullable=True)
    vencimiento: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fuente_precio: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=True)
    monto_a_pagar: Mapped[float] = mapped_column(nullable=True)
    arrendamiento_id: Mapped[int] = mapped_column(ForeignKey("arrendamiento.id"), nullable=False)

    #Relaciones
    arrendamiento: Mapped["Arrendamiento"] = relationship()
