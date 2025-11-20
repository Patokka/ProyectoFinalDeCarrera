from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from dtos.FacturacionDto import FacturacionDtoOut

class RetencionDto(BaseModel):
    """
    DTO para la creación de una retención.
    Atributos:
        fecha_retencion (date): Fecha de la retención.
        monto_imponible (float): Monto sobre el cual se aplica la retención.
        total_retencion (float): Total retenido.
        arrendador_id (int): Identificador del arrendador.
        facturacion_id (int): Identificador de la facturación asociada.
    """
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
    """
    DTO de salida para representar una retención.
    Atributos:
        id (int): Identificador único de la retención.
        fecha_retencion (date): Fecha de la retención.
        monto_imponible (float): Monto imponible.
        total_retencion (float): Total retenido.
        arrendador (ArrendadorDtoOut): Información del arrendador.
        facturacion (FacturacionDtoOut): Información de la facturación.
    """
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
    """
    DTO para la modificación de una retención.
    Atributos:
        fecha_retencion (Optional[date]): Nueva fecha de retención.
        total_retencion (Optional[float]): Nuevo total retenido.
    """
    fecha_retencion: Optional[date]
    total_retencion: Optional[float]
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }