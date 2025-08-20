from datetime import date
from decimal import Decimal
from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.model.pago_precio_association import pago_precio_association
from backend.model.ParticipacionArrendador import ParticipacionArrendador
from backend.model.Precio import Precio
from backend.util.database import Base
from backend.enums.EstadoPago import EstadoPago
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.Arrendamiento import Arrendamiento


class Pago(Base):
    __tablename__ = "pago"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    estado: Mapped[EstadoPago] = mapped_column(Enum(EstadoPago), nullable=False, default=EstadoPago.PENDIENTE)
    quintales: Mapped[float] = mapped_column(nullable=True)
    precio_promedio: Mapped[float] = mapped_column(nullable=True)
    vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    fuente_precio: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=True)
    monto_a_pagar: Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=True)
    arrendamiento_id: Mapped[int] = mapped_column(ForeignKey("arrendamiento.id"), nullable=False)
    participacion_arrendador_id: Mapped[int] = mapped_column(ForeignKey("participacion_arrendador.id"), nullable=False)

    #Relaciones
    arrendamiento: Mapped["Arrendamiento"] = relationship()
    participacion_arrendador: Mapped["ParticipacionArrendador"] = relationship()
    
    precios: Mapped[list["Precio"]] = relationship(
        "Precio",
        secondary=pago_precio_association,
        back_populates="pagos"
    )
