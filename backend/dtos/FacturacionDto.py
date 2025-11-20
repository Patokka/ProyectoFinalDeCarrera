from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from dtos.PagoDto import PagoDtoOut
from enums.TipoFactura import TipoFactura

class FacturacionDto(BaseModel):
    """
    DTO para la creación de una facturación.
    Atributos:
        pago_id (int): Identificador del pago asociado a la factura.
    """
    pago_id: int
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
class FacturacionDtoOut(BaseModel):
    """
    DTO de salida para representar una facturación.
    Atributos:
        id (int): Identificador único de la facturación.
        fecha_facturacion (date): Fecha de emisión de la factura.
        tipo_factura (TipoFactura): Tipo de factura emitida.
        monto_facturacion (float): Monto total facturado.
        arrendador (ArrendadorDtoOut): Información del arrendador asociado.
        pago (PagoDtoOut): Información del pago asociado.
    """
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
    """
    DTO para la modificación de una facturación.
    Atributos:
        fecha_facturacion (Optional[date]): Nueva fecha de facturación.
        monto_facturacion (Optional[float]): Nuevo monto de facturación.
    """
    fecha_facturacion: Optional[date]
    monto_facturacion: Optional[float]
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }