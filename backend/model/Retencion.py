from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.model.Arrendador import Arrendador
from backend.model.Facturacion import Facturacion
from backend.util.database import Base

class Retencion(Base):
    __tablename__ = "retencion"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_retencion:  Mapped[datetime] = mapped_column(DateTime, nullable=False)
    minimo_imponible: Mapped[float] = mapped_column(nullable=False)
    total_retencion: Mapped[float] = mapped_column(nullable=False)
    arrendador_id: Mapped[int] = mapped_column(ForeignKey("arrendador.id"), nullable=False)
    facturacion_id: Mapped[int] = mapped_column(ForeignKey("facturacion.id"), nullable=False)

    #Relaciones
    arrendador: Mapped["Arrendador"] = relationship()
    facturacion: Mapped["Facturacion"] = relationship()