from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.dtos.ArrendadorDto import ArrendadorDtoOut
from backend.dtos.PagoDto import PagoDtoOut

class FacturacionDto(BaseModel):
    fecha_facturacion: datetime
    monto_facturacion: float
    arrendador_id: int
    pago_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
class FacturacionDtoOut(BaseModel):
    id: int
    fecha_facturacion: datetime
    monto_facturacion: float
    arrendador: ArrendadorDtoOut 
    pago: PagoDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class FacturacionDtoModificacion(BaseModel):
    fecha_facturacion: Optional[datetime]
    monto_facturacion: Optional[float]
    arrendador_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }