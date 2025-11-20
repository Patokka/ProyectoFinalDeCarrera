from datetime import date
from decimal import Decimal
from sqlalchemy import Date, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.Arrendador import Arrendador
from model.Facturacion import Facturacion
from util.database import Base

class Retencion(Base):
    """
    Modelo de base de datos que representa una Retención impositiva.
    Atributos:
        id (int): Clave primaria.
        fecha_retencion (date): Fecha de la retención.
        monto_imponible (Decimal): Monto sobre el cual se calcula la retención.
        total_retencion (Decimal): Monto retenido.
        arrendador_id (int): Clave foránea al arrendador.
        facturacion_id (int): Clave foránea a la facturación.
        arrendador (Arrendador): Relación con el arrendador.
        facturacion (Facturacion): Relación con la facturación.
    """
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