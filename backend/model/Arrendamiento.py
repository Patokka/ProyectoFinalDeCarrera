from datetime import date
from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enums.EstadoArrendamiento import EstadoArrendamiento
from enums.TipoArrendamiento import TipoArrendamiento
from enums.PlazoPago import PlazoPago
from enums.TipoDiasPromedio import TipoDiasPromedio
from enums.TipoOrigenPrecio import TipoOrigenPrecio
from model.Arrendatario import Arrendatario
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Localidad import Localidad
from model.Usuario import Usuario
from util.database import Base

class Arrendamiento(Base):
    __tablename__ = "arrendamiento"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    estado: Mapped[EstadoArrendamiento] = mapped_column(Enum(EstadoArrendamiento), nullable=False, default=EstadoArrendamiento.ACTIVO)
    tipo: Mapped[TipoArrendamiento] = mapped_column(Enum(TipoArrendamiento), nullable=False)
    localidad_id: Mapped[int] = mapped_column(ForeignKey("localidad.id"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuario.id"), nullable=False)
    arrendatario_id: Mapped[int] = mapped_column(ForeignKey("arrendatario.id"), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    quintales: Mapped[float] = mapped_column(nullable=False)
    hectareas: Mapped[float] = mapped_column(nullable=False)
    plazo_pago: Mapped[PlazoPago] = mapped_column(Enum(PlazoPago), nullable=False)
    dias_promedio: Mapped[TipoDiasPromedio] = mapped_column(Enum(TipoDiasPromedio), nullable=False)
    origen_precio: Mapped[TipoOrigenPrecio] = mapped_column(Enum(TipoOrigenPrecio), nullable=False)
    porcentaje_aparceria: Mapped[float] = mapped_column(nullable=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Relaciones
    localidad: Mapped["Localidad"] = relationship()
    usuario: Mapped["Usuario"] = relationship()
    arrendatario: Mapped["Arrendatario"] = relationship()
    participaciones: Mapped[list["ParticipacionArrendador"]] = relationship(
        back_populates="arrendamiento"
    )