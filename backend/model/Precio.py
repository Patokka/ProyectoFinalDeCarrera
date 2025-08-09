from datetime import date
from sqlalchemy import Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.util.database import Base
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.ConsultaPrecio import ConsultaPrecio

class Precio(Base):
    __tablename__ = "precio"

    id:  Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_precio:  Mapped[date] = mapped_column(Date, nullable=False)
    precio_obtenido:  Mapped[float] = mapped_column(nullable=False)
    origen: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=False)
    consulta_precio_id: Mapped[int] = mapped_column(ForeignKey("consulta_precio.id"), nullable=True)
    
    #Relaciones
    consulta_precio: Mapped["ConsultaPrecio"] = relationship()
