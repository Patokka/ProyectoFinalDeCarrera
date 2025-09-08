from datetime import date
from sqlalchemy import Date, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.pago_precio_association import pago_precio_association
from util.database import Base
from enums.TipoOrigenPrecio import TipoOrigenPrecio

class Precio(Base):
    __tablename__ = "precio"
    __table_args__ = (
        UniqueConstraint("fecha_precio", "origen", name="uq_fecha_origen"),
    )

    id:  Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_precio:  Mapped[date] = mapped_column(Date, nullable=False)
    precio_obtenido:  Mapped[float] = mapped_column(nullable=False) #Acá los precios que se guardan, independientemente del origen, son precios por TONELADA DE SOJA
    origen: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=False)
    
    
    pagos: Mapped[list["Pago"]] = relationship(
        "Pago",
        secondary=pago_precio_association,
        back_populates="precios"
    )