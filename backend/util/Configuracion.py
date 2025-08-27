from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from backend.util.database import Base

class Configuracion(Base):
    __tablename__ = "configuracion"

    clave: Mapped[str] = mapped_column(String(50), primary_key=True)
    valor: Mapped[str] = mapped_column(String(255), nullable=False)
 