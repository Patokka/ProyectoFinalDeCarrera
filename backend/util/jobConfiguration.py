
from sqlalchemy import Boolean, Integer, String
from util.database import Base
from sqlalchemy.orm import Mapped, mapped_column

class jobConfiguration(Base):
    """
    Modelo de base de datos que representa la configuración de un trabajo programado (Job).
    Atributos:
        job_id (str): Identificador único del job.
        hour (int): Hora de ejecución programada.
        minute (int): Minuto de ejecución programada.
        day (int): Día de ejecución programada (si aplica).
        active (bool): Estado de activación del job.
    """
    __tablename__ = "job_config"

    job_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    hour:  Mapped[int] = mapped_column(Integer, nullable=True)
    minute:  Mapped[int] = mapped_column(Integer, nullable=True)
    day:  Mapped[int] = mapped_column(Integer, nullable=True)
    active:  Mapped[bool] = mapped_column(Boolean, nullable=True)