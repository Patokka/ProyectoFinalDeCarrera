from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.Provincia import Provincia
from util.database import Base

class Localidad(Base):
    """
    Modelo de base de datos que representa una Localidad.
    Atributos:
        id (int): Clave primaria.
        nombre_localidad (str): Nombre de la localidad.
        provincia_id (int): Clave foránea a la provincia.
        provincia (Provincia): Relación con la provincia.
    """
    __tablename__ = "localidad"
    __table_args__ = (
        UniqueConstraint("nombre_localidad", "provincia_id", name="uq_localidad_provincia_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_localidad:  Mapped[str] = mapped_column(String(255), nullable=False)
    provincia_id: Mapped[int] = mapped_column(ForeignKey("provincia.id"), nullable=False)
    
    #Relaciones
    provincia: Mapped["Provincia"] = relationship()