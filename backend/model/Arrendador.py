from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enums.TipoCondicion import TipoCondicion 
from model.Localidad import Localidad
from util.database import Base

class Arrendador(Base):
    __tablename__ = "arrendador"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_o_razon_social: Mapped[str] = mapped_column(String(255),nullable=False, unique=True)
    cuil:  Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    condicion_fiscal: Mapped[TipoCondicion] = mapped_column(Enum(TipoCondicion), nullable=False)
    mail: Mapped[str] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str] = mapped_column(String(100), nullable=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=True)
    localidad_id: Mapped[int] = mapped_column(ForeignKey("localidad.id"), nullable=False)

    #Relaciones
    localidad: Mapped["Localidad"] = relationship()
