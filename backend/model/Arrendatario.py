from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.enums.TipoCondicion import TipoCondicion
from backend.model.Localidad import Localidad
from backend.util.database import Base

class Arrendatario(Base):
    __tablename__ = "arrendatario"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    cuit: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    condicion_fiscal: Mapped[TipoCondicion] = mapped_column(Enum(TipoCondicion), nullable=False)
    mail: Mapped[str] = mapped_column(String(255), nullable=False)
    localidad_id: Mapped[int] = mapped_column(ForeignKey("localidad.id"), nullable=False)
    
    #Relaciones
    localidad:  Mapped["Localidad"] = relationship()
