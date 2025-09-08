from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from dtos.PagoDto import PagoDtoOut
from enums.TipoFactura import TipoFactura

class FacturacionDto(BaseModel):
    pago_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
class FacturacionDtoOut(BaseModel):
    id: int
    fecha_facturacion: date
    tipo_factura: TipoFactura
    monto_facturacion: float
    arrendador: ArrendadorDtoOut 
    pago: PagoDtoOut
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class FacturacionDtoModificacion(BaseModel):
    fecha_facturacion: Optional[date]
    tipo_factura: Optional[TipoFactura]
    monto_facturacion: Optional[float]
    arrendador_id: Optional[int]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }