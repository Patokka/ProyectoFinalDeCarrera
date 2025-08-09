from datetime import date
from typing import Optional
from pydantic import BaseModel
from backend.enums.EstadoArrendamiento import EstadoArrendamiento
from backend.enums.PlazoPago import PlazoPago
from backend.enums.TipoArrendamiento import TipoArrendamiento
from backend.enums.TipoDiasPromedio import TipoDiasPromedio
from backend.dtos.LocalidadDto import LocalidadDtoOut
from backend.dtos.UsuarioDto import UsuarioDtoOut
from backend.dtos.ArrendatarioDto import ArrendatarioDtoOut

class ArrendamientoDto(BaseModel):
    tipo: TipoArrendamiento
    localidad_id: int
    usuario_id: int
    arrendatario_id: int
    fecha_inicio: date
    fecha_fin: date
    duracion_meses: int
    quintales: float
    hectareas: float
    plazo_pago: PlazoPago
    dias_promedio: TipoDiasPromedio
    porcentaje_aparceria: Optional[float]
    descripcion: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True        
    }
    
class ArrendamientoDtoOut(BaseModel):
    id: int
    estado: EstadoArrendamiento
    tipo: TipoArrendamiento
    localidad: LocalidadDtoOut
    usuario: UsuarioDtoOut
    arrendatario: ArrendatarioDtoOut
    fecha_inicio: date
    fecha_fin: date
    duracion_meses: int
    quintales: float
    hectareas: float
    plazo_pago: PlazoPago
    dias_promedio: TipoDiasPromedio
    porcentaje_aparceria: Optional[float]
    descripcion: Optional[str]

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }
    
class ArrendamientoDtoModificacion(BaseModel):
    estado: Optional[EstadoArrendamiento]
    descripcion: Optional[str]

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True         
    }