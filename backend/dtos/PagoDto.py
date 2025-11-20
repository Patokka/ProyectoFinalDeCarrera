from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendamientoDto import ArrendamientoDtoOut
from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDtoOut
from enums.EstadoPago import EstadoPago
from enums.TipoOrigenPrecio import TipoOrigenPrecio
from enums.TipoDiasPromedio import TipoDiasPromedio

class PagoDto(BaseModel):
    """
    DTO para la creación de un pago.
    Atributos:
        quintales (Optional[float]): Cantidad de quintales a pagar.
        vencimiento (date): Fecha de vencimiento del pago.
        fuente_precio (TipoOrigenPrecio): Fuente del precio utilizada.
        arrendamiento_id (int): Identificador del arrendamiento.
        participacion_arrendador_id (int): Identificador de la participación del arrendador.
        porcentaje (Optional[float]): Porcentaje de pago.
        dias_promedio (Optional[TipoDiasPromedio]): Tipo de días promedio.
    """
    quintales: Optional[float]
    vencimiento: date
    fuente_precio: TipoOrigenPrecio
    arrendamiento_id: int
    participacion_arrendador_id: int
    porcentaje: Optional[float]
    dias_promedio: Optional[TipoDiasPromedio]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True   
    }
    
class PagoDtoOut(BaseModel):
    """
    DTO de salida para representar un pago.
    Atributos:
        id (int): Identificador único del pago.
        estado (EstadoPago): Estado actual del pago.
        quintales (Optional[float]): Quintales pagados.
        precio_promedio (Optional[float]): Precio promedio calculado.
        vencimiento (date): Fecha de vencimiento.
        fuente_precio (Optional[TipoOrigenPrecio]): Fuente del precio.
        monto_a_pagar (Optional[float]): Monto total a pagar.
        arrendamiento (ArrendamientoDtoOut): Arrendamiento asociado.
        participacion_arrendador (ParticipacionArrendadorDtoOut): Participación del arrendador.
        porcentaje (Optional[float]): Porcentaje aplicado.
        dias_promedio (Optional[TipoDiasPromedio]): Días promedio utilizados.
    """
    id: int
    estado: EstadoPago
    quintales: Optional[float]
    precio_promedio: Optional[float]
    vencimiento: date
    fuente_precio: Optional[TipoOrigenPrecio] = None
    monto_a_pagar: Optional[float]
    arrendamiento: ArrendamientoDtoOut
    participacion_arrendador: ParticipacionArrendadorDtoOut
    porcentaje: Optional[float]
    dias_promedio: Optional[TipoDiasPromedio]
    
    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }
    
class PagoDtoModificacion(BaseModel):
    """
    DTO para la modificación de un pago.
    Atributos:
        quintales (Optional[float]): Nuevos quintales.
        vencimiento (Optional[date]): Nueva fecha de vencimiento.
        fuente_precio (Optional[TipoOrigenPrecio]): Nueva fuente de precio.
        arrendamiento_id (int): Nuevo identificador de arrendamiento.
        participacion_arrendador_id (int): Nuevo identificador de participación.
        dias_promedio (TipoDiasPromedio): Nuevos días promedio.
        porcentaje (Optional[float]): Nuevo porcentaje.
        monto_a_pagar (Optional[float]): Nuevo monto a pagar.
        precio_promedio (Optional[float]): Nuevo precio promedio.
    """
    quintales: Optional[float] = None
    vencimiento: Optional[date]
    fuente_precio: Optional[TipoOrigenPrecio]
    arrendamiento_id: int
    participacion_arrendador_id: int
    dias_promedio: TipoDiasPromedio
    porcentaje: Optional[float] = None
    monto_a_pagar: Optional[float]
    precio_promedio: Optional[float]

    model_config = {
        "from_attributes": True,
        "use_enum_values": True
    }
    
class PagoResumenDto(BaseModel):
    """
    DTO para resumen de pago.
    Atributos:
        arrendatario (str): Nombre o razón social del arrendatario.
        cantidad (int): Cantidad de pagos.
        monto (float): Monto total acumulado.
    """
    arrendatario: str
    cantidad: int
    monto: float
    
class PagoFechaEstado(BaseModel):
    """
    DTO para representar estado de pago por fecha.
    Atributos:
        fecha (str): Fecha del estado.
        estado (str): Estado del pago.
    """
    fecha: str
    estado: str

class QuintalesResumenDto(BaseModel):
    """
    DTO para resumen de quintales.
    Atributos:
        arrendatario (str): Nombre del arrendatario.
        cantidad (int): Cantidad de registros.
        quintales (float): Total de quintales.
    """
    arrendatario: str
    cantidad: int
    quintales: float