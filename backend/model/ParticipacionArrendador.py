from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.Arrendador import Arrendador
from model.Arrendamiento import Arrendamiento
from util.database import Base


class ParticipacionArrendador(Base):
    __tablename__ = "participacion_arrendador"
    __table_args__ = (
        UniqueConstraint("arrendamiento_id", "arrendador_id", name="uq_arrendamiento_arrendador"),
    )


    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    hectareas_asignadas: Mapped[float] = mapped_column(nullable=False)
    quintales_asignados: Mapped[float] = mapped_column(nullable=False)
    porcentaje: Mapped[float] = mapped_column(nullable=False)
    observacion: Mapped[str] = mapped_column(String(255), nullable=True)
    arrendador_id: Mapped[int] = mapped_column(ForeignKey("arrendador.id"), nullable=False)
    arrendamiento_id:  Mapped[int] = mapped_column(ForeignKey("arrendamiento.id"), nullable=False)
    
    #Relaciones
    arrendador: Mapped["Arrendador"] = relationship()  # noqa: F821
    arrendamiento: Mapped["Arrendamiento"] = relationship()