from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.Provincia import Provincia
from util.database import Base

class Localidad(Base):
    __tablename__ = "localidad"
    __table_args__ = (
        UniqueConstraint("nombre_localidad", "provincia_id", name="uq_localidad_provincia_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_localidad:  Mapped[str] = mapped_column(String(255), nullable=False)
    provincia_id: Mapped[int] = mapped_column(ForeignKey("provincia.id"), nullable=False)
    
    #Relaciones
    provincia: Mapped["Provincia"] = relationship()