from datetime import date
from decimal import Decimal
from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.model.Arrendador import Arrendador
from backend.model.Facturacion import Facturacion
from backend.util.database import Base

class Retencion(Base):
    __tablename__ = "retencion"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_retencion:  Mapped[date] = mapped_column(Date, nullable=False)
    monto_imponible: Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=False)
    total_retencion: Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=False)
    arrendador_id: Mapped[int] = mapped_column(ForeignKey("arrendador.id"), nullable=False)
    facturacion_id: Mapped[int] = mapped_column(ForeignKey("facturacion.id"), nullable=False)

    #Relaciones
    arrendador: Mapped["Arrendador"] = relationship()
    facturacion: Mapped["Facturacion"] = relationship()