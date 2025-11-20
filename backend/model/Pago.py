from datetime import date
from decimal import Decimal
from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.pago_precio_association import pago_precio_association
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Precio import Precio
from util.database import Base
from enums.EstadoPago import EstadoPago
from enums.TipoDiasPromedio import TipoDiasPromedio
from enums.TipoOrigenPrecio import TipoOrigenPrecio
from model.Arrendamiento import Arrendamiento

class Pago(Base):
    """
    Modelo de base de datos que representa un Pago.
    Atributos:
        id (int): Clave primaria.
        estado (EstadoPago): Estado del pago (Pendiente, Pagado, etc.).
        quintales (float): Cantidad de quintales a pagar.
        precio_promedio (Decimal): Precio promedio calculado para el pago.
        vencimiento (date): Fecha de vencimiento del pago.
        fuente_precio (TipoOrigenPrecio): Fuente de donde se obtuvo el precio.
        monto_a_pagar (Decimal): Monto monetario total a pagar.
        arrendamiento_id (int): Clave foránea al arrendamiento.
        participacion_arrendador_id (int): Clave foránea a la participación del arrendador.
        porcentaje (float): Porcentaje de cosecha a entregar en caso de que aplique.
        dias_promedio (TipoDiasPromedio): Tipo de días promedio utilizado.
        arrendamiento (Arrendamiento): Relación con el arrendamiento.
        participacion_arrendador (ParticipacionArrendador): Relación con la participación.
        precios (list[Precio]): Lista de precios asociados al pago para calcuular el promedio.
    """
    __tablename__ = "pago"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    estado: Mapped[EstadoPago] = mapped_column(Enum(EstadoPago), nullable=False, default=EstadoPago.PENDIENTE)
    quintales: Mapped[float] = mapped_column(nullable=True)
    precio_promedio:  Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=True)
    vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    fuente_precio: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=True)
    monto_a_pagar: Mapped[Decimal] = mapped_column(Numeric(12,2),nullable=True)
    arrendamiento_id: Mapped[int] = mapped_column(ForeignKey("arrendamiento.id"), nullable=False)
    participacion_arrendador_id: Mapped[int] = mapped_column(ForeignKey("participacion_arrendador.id"), nullable=False)
    porcentaje: Mapped[float] = mapped_column(nullable=True)
    dias_promedio: Mapped[TipoDiasPromedio | None] = mapped_column(Enum(TipoDiasPromedio, nullable=True))
    
    #Relaciones
    arrendamiento: Mapped["Arrendamiento"] = relationship()
    participacion_arrendador: Mapped["ParticipacionArrendador"] = relationship()
    precios: Mapped[list["Precio"]] = relationship("Precio",secondary=pago_precio_association,back_populates="pagos")
