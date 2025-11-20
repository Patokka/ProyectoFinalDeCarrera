from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from model.ParticipacionArrendador import ParticipacionArrendador
from enums.TipoCondicion import TipoCondicion 
from model.Localidad import Localidad
from util.database import Base

class Arrendador(Base):
    """
    Modelo de base de datos que representa a un Arrendador.
    Atributos:
        id (int): Clave primaria.
        nombre_o_razon_social (str): Nombre o Razón Social.
        cuil (str): CUIT o CUIL.
        condicion_fiscal (TipoCondicion): Condición fiscal ante AFIP.
        mail (str): Correo electrónico.
        telefono (str): Número de teléfono.
        descripcion (str): Descripción adicional.
        localidad_id (int): Clave foránea a la localidad.
        localidad (Localidad): Relación con el objeto Localidad.
        participaciones (list[ParticipacionArrendador]): Relación con las participaciones en arrendamientos.
    """
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
    participaciones: Mapped[list["ParticipacionArrendador"]] = relationship(
        "ParticipacionArrendador",back_populates="arrendador"
    )