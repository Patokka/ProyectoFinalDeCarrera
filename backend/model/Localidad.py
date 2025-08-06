from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.model.Provincia import Provincia
from backend.util.database import Base

class Localidad(Base):
    __tablename__ = "localidad"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_localidad:  Mapped[str] = mapped_column(String(255), nullable=False)
    provincia_id: Mapped[int] = mapped_column(ForeignKey("provincia.id"), nullable=False)
    
    #Relaciones
    provincia: Mapped["Provincia"] = relationship()