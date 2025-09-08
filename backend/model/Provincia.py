
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from util.database import Base


class Provincia(Base):
    __tablename__ = "provincia"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_provincia: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)