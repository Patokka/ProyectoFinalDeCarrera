
from sqlalchemy import Boolean, Integer, String
from backend.util.database import Base
from sqlalchemy.orm import Mapped, mapped_column

class jobConfiguration(Base):
    __tablename__ = "job_config"

    job_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    hour:  Mapped[int] = mapped_column(Integer, nullable=True)
    minute:  Mapped[int] = mapped_column(Integer, nullable=True)
    day:  Mapped[int] = mapped_column(Integer, nullable=True)
    active:  Mapped[bool] = mapped_column(Boolean, nullable=True)