from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.enums.EstadoArrendamiento import EstadoArrendamiento
from backend.enums.TipoArrendamiento import TipoArrendamiento
from backend.enums.PlazoPago import PlazoPago
from backend.enums.TipoDiasPromedio import TipoDiasPromedio
from backend.model.Arrendatario import Arrendatario
from backend.model.Localidad import Localidad
from backend.model.Usuario import Usuario
from backend.util.database import Base

class Arrendamiento(Base):
    __tablename__ = "arrendamiento"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    estado: Mapped[EstadoArrendamiento] = mapped_column(Enum(EstadoArrendamiento), nullable=False, default=EstadoArrendamiento.ACTIVO)
    tipo: Mapped[TipoArrendamiento] = mapped_column(Enum(TipoArrendamiento), nullable=False)
    localidad_id: Mapped[int] = mapped_column(ForeignKey("localidad.id"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuario.id"), nullable=False)
    arrendatario_id: Mapped[int] = mapped_column(ForeignKey("arrendatario.id"), nullable=False)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duracion_meses: Mapped[int] = mapped_column(nullable=False)
    quintales: Mapped[float] = mapped_column(nullable=False)
    hectareas: Mapped[float] = mapped_column(nullable=False)
    plazo_pago: Mapped[PlazoPago] = mapped_column(Enum(PlazoPago), nullable=False)
    dias_promedio: Mapped[TipoDiasPromedio] = mapped_column(Enum(TipoDiasPromedio), nullable=False)
    porcentaje_aparceria: Mapped[float] = mapped_column(nullable=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Relaciones
    localidad: Mapped["Localidad"] = relationship()
    usuario: Mapped["Usuario"] = relationship()
    arrendatario: Mapped["Arrendatario"] = relationship()