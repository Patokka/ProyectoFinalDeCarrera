from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from util.database import Base

class Configuracion(Base):
    """
    Modelo de base de datos que representa una configuración del sistema.
    Atributos:
        clave (str): Clave única de la configuración.
        valor (str): Valor asociado a la clave.
    """
    __tablename__ = "configuracion"

    clave: Mapped[str] = mapped_column(String(50), primary_key=True)
    valor: Mapped[str] = mapped_column(String(255), nullable=False)