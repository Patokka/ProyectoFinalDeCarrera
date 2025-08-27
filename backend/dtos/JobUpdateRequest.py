from pydantic import BaseModel
from typing import Optional

class JobUpdateRequest(BaseModel):
    job_id: str  # nombre del job
    day: Optional[int] = None
    hour: Optional[int] = None
    minute: Optional[int] = None
    active: bool