from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.util.database import Base
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.Pago import Pago

class ConsultaPrecio(Base):
    __tablename__ = "consulta_precio"

    id:  Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_consulta: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    precio_promedio: Mapped[float] = mapped_column(nullable=True)
    origen: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=False)
    pago_id: Mapped[int] = mapped_column(ForeignKey("pago.id"), nullable=False)

    #Relaciones
    pago: Mapped["Pago"] = relationship()