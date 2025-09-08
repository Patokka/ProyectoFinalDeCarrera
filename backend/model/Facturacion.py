from datetime import date
from decimal import Decimal
from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enums.TipoFactura import TipoFactura
from model.Arrendador import Arrendador
from model.Pago import Pago
from util.database import Base

class Facturacion(Base):
    __tablename__ = "facturacion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha_facturacion: Mapped[date] = mapped_column(Date, nullable=False)
    tipo_factura:  Mapped[TipoFactura] = mapped_column(Enum(TipoFactura), nullable=False)
    monto_facturacion:  Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=False)
    arrendador_id: Mapped[int] = mapped_column(ForeignKey("arrendador.id"), nullable=False)
    pago_id: Mapped[int] = mapped_column(ForeignKey("pago.id"), nullable=False)
    
    
    #Relaciones
    arrendador: Mapped["Arrendador"] = relationship()
    pago: Mapped["Pago"] = relationship()