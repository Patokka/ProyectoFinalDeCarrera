from typing import Optional
from pydantic import BaseModel
from backend.dtos.ArrendadorDto import ArrendadorDtoOut
from backend.dtos.ArrendamientoDto import ArrendamientoDtoOut

class ParticipacionArrendadorDto(BaseModel):
    hectareas_asignadas: float
    quintales_asignados: float
    porcentaje: float
    observacion: Optional[str]
    arrendador_id: int
    arrendamiento_id: int
    
class ParticipacionArrendadorDtoOut(BaseModel):
    id: int
    hectareas_asignadas: float
    quintales_asignados: float
    porcentaje: float
    observacion: Optional[str]
    arrendador: ArrendadorDtoOut
    arrendamiento: ArrendamientoDtoOut
    
    model_config = {
        "from_attributes": True
    }

class ParticipacionArrendadorDtoModificacion(BaseModel):
    hectareas_asignadas: Optional[float]
    quintales_asignados: Optional[float]
    porcentaje: Optional[float]
    observacion: Optional[str]
    arrendador_id: Optional[int]
    arrendamiento_id: Optional[int]
