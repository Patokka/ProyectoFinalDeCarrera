from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enums.TipoCondicion import TipoCondicion
from model.Localidad import Localidad
from util.database import Base

class Arrendatario(Base):
    """
    Modelo de base de datos que representa a un Arrendatario (Inquilino).
    Atributos:
        id (int): Clave primaria.
        razon_social (str): Razón Social del arrendatario.
        cuit (str): CUIT del arrendatario.
        condicion_fiscal (TipoCondicion): Condición fiscal.
        mail (str): Correo electrónico.
        localidad_id (int): Clave foránea a la localidad.
        localidad (Localidad): Relación con la localidad.
        arrendamientos (list[Arrendamiento]): Lista de arrendamientos asociados.
    """
    __tablename__ = "arrendatario"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    cuit: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    condicion_fiscal: Mapped[TipoCondicion] = mapped_column(Enum(TipoCondicion), nullable=False)
    mail: Mapped[str] = mapped_column(String(255), nullable=True)
    localidad_id: Mapped[int] = mapped_column(ForeignKey("localidad.id"), nullable=False)
    
    #Relaciones
    localidad:  Mapped["Localidad"] = relationship()
    arrendamientos: Mapped[list["Arrendamiento"]] = relationship(back_populates="arrendatario") # type: ignore NO ELIMINAR COMENTARIO
