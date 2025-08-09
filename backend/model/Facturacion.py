from datetime import date
from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.model.Arrendador import Arrendador
from backend.model.Pago import Pago
from backend.util.database import Base

class Facturacion(Base):
    __tablename__ = "facturacion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_facturacion: Mapped[date] = mapped_column(Date, nullable=False)
    monto_facturacion:  Mapped[float] = mapped_column(nullable=False)
    arrendador_id: Mapped[int] = mapped_column(ForeignKey("arrendador.id"), nullable=False)
    pago_id: Mapped[int] = mapped_column(ForeignKey("pago.id"), nullable=False)
    
    
    #Relaciones
    arrendador: Mapped["Arrendador"] = relationship()
    pago: Mapped["Pago"] = relationship()