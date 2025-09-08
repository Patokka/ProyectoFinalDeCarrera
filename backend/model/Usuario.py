from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column
from enums.TipoRol import TipoRol
from util.database import Base

class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(75),nullable=False)
    apellido: Mapped[str] = mapped_column(String(75),nullable=False)
    contrasena: Mapped[str] = mapped_column(String(255),nullable=False, unique=True)
    mail: Mapped[str] = mapped_column(String(255),nullable=False)
    cuil: Mapped[str] = mapped_column(String(20),nullable=False, unique=True)
    rol: Mapped[TipoRol] = mapped_column(Enum(TipoRol), nullable=False)