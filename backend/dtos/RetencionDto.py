from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.dtos.ArrendadorDto import ArrendadorDtoOut
from backend.dtos.FaturacionDto import FacturacionDtoOut

class RetencionDto(BaseModel):
    fecha_retencion: datetime
    minimo_imponible: float
    total_retencion: float
    arrendador_id: int
    facturacion_id: int
    
class RetencionDtoOut(BaseModel):
    id: int
    fecha_retencion: datetime
    minimo_imponible: float
    total_retencion: float
    arrendador: ArrendadorDtoOut
    facturacion: FacturacionDtoOut
    
    model_config = {
        "from_attributes": True    
    }

class RetencionDtoModificacion(BaseModel):
    fecha_retencion: Optional[datetime]
    minimo_imponible: Optional[float]
    total_retencion: Optional[float]
    arrendador_id: Optional[int]
    facturacion_id: Optional[int]