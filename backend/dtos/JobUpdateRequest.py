from pydantic import BaseModel
from typing import Optional

class JobUpdateRequest(BaseModel):
    """
    DTO para la solicitud de actualización de un trabajo programado (Job).
    Atributos:
        job_id (str): Identificador o nombre del job.
        day (Optional[int]): Día de ejecución.
        hour (Optional[int]): Hora de ejecución.
        minute (Optional[int]): Minuto de ejecución.
        active (bool): Indica si el job debe estar activo.
    """
    job_id: str 
    day: Optional[int] = None
    hour: Optional[int] = None
    minute: Optional[int] = None
    active: bool