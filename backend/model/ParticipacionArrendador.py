from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from util.database import Base


class ParticipacionArrendador(Base):
    """
    Modelo de base de datos que representa la participación de un Arrendador en un Arrendamiento.
    Atributos:
        id (int): Clave primaria.
        hectareas_asignadas (float): Hectáreas asignadas a este arrendador en el contrato.
        quintales_asignados (float): Quintales asignados.
        porcentaje (float): Porcentaje de participación en el contrato.
        observacion (str): Observaciones.
        arrendador_id (int): Clave foránea al arrendador.
        arrendamiento_id (int): Clave foránea al arrendamiento.
        arrendador (Arrendador): Relación con el arrendador.
        arrendamiento (Arrendamiento): Relación con el arrendamiento.
    """
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
    
    #Relaciones, ESTÁ BIEN QUE NO TENGAN EL IMPORT DEL MODELO, SI LOS PONES SE HACE IMPORT CIRCULAR Y NO ANDA. TEMA DE SQLALCHEMY
    arrendador: Mapped["Arrendador"] = relationship("Arrendador",back_populates="participaciones") # type: ignore
    arrendamiento: Mapped["Arrendamiento"] = relationship("Arrendamiento",back_populates="participaciones") # type: ignore