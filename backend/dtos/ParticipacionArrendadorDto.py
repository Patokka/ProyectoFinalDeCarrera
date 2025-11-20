from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from dtos.ArrendamientoDto import ArrendamientoDtoOut

class ParticipacionArrendadorDto(BaseModel):
    """
    DTO para la creación de una participación de arrendador.
    Atributos:
        hectareas_asignadas (float): Hectáreas asignadas al arrendador.
        quintales_asignados (float): Quintales asignados.
        porcentaje (float): Porcentaje de participación.
        observacion (Optional[str]): Observaciones adicionales.
        arrendador_id (int): Identificador del arrendador.
        arrendamiento_id (int): Identificador del arrendamiento.
    """
    hectareas_asignadas: float
    quintales_asignados: float
    porcentaje: float
    observacion: Optional[str]
    arrendador_id: int
    arrendamiento_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class ParticipacionArrendadorDtoOut(BaseModel):
    """
    DTO de salida para representar una participación de arrendador.
    Atributos:
        id (int): Identificador único de la participación.
        hectareas_asignadas (float): Hectáreas asignadas.
        quintales_asignados (float): Quintales asignados.
        porcentaje (float): Porcentaje de participación.
        observacion (Optional[str]): Observaciones.
        arrendador (ArrendadorDtoOut): Información del arrendador.
        arrendamiento (ArrendamientoDtoOut): Información del arrendamiento.
    """
    id: int
    hectareas_asignadas: float
    quintales_asignados: float
    porcentaje: float
    observacion: Optional[str]
    arrendador: ArrendadorDtoOut
    arrendamiento: ArrendamientoDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class ParticipacionArrendadorDtoModificacion(BaseModel):
    """
    DTO para la modificación de una participación de arrendador.
    Atributos:
        hectareas_asignadas (Optional[float]): Nuevas hectáreas asignadas.
        quintales_asignados (Optional[float]): Nuevos quintales asignados.
        porcentaje (Optional[float]): Nuevo porcentaje.
        observacion (Optional[str]): Nuevas observaciones.
        arrendador_id (Optional[int]): Nuevo identificador de arrendador.
        arrendamiento_id (Optional[int]): Nuevo identificador de arrendamiento.
    """
    hectareas_asignadas: Optional[float]
    quintales_asignados: Optional[float]
    porcentaje: Optional[float]
    observacion: Optional[str]
    arrendador_id: Optional[int]
    arrendamiento_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
