from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from dtos.FacturacionDto import FacturacionDtoOut

class RetencionDto(BaseModel):
    fecha_retencion: date
    monto_imponible: float
    total_retencion: float
    arrendador_id: int
    facturacion_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class RetencionDtoOut(BaseModel):
    id: int
    fecha_retencion: date
    monto_imponible: float
    total_retencion: float
    arrendador: ArrendadorDtoOut
    facturacion: FacturacionDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }

class RetencionDtoModificacion(BaseModel):
    fecha_retencion: Optional[date]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }