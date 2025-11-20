from datetime import date
from typing import Optional
from pydantic import BaseModel
from dtos.ArrendadorDto import ArrendadorDtoOut
from enums.EstadoArrendamiento import EstadoArrendamiento
from enums.PlazoPago import PlazoPago
from enums.TipoArrendamiento import TipoArrendamiento
from enums.TipoDiasPromedio import TipoDiasPromedio
from dtos.LocalidadDto import LocalidadDtoOut
from dtos.UsuarioDto import UsuarioDtoOut
from dtos.ArrendatarioDto import ArrendatarioDtoOut
from enums.TipoOrigenPrecio import TipoOrigenPrecio

class ArrendamientoDto(BaseModel):
    """
    DTO para la creación de un arrendamiento.
    Atributos:
        tipo (TipoArrendamiento): Tipo de arrendamiento.
        localidad_id (int): Identificador de la localidad.
        usuario_id (int): Identificador del usuario responsable.
        arrendatario_id (int): Identificador del arrendatario.
        fecha_inicio (date): Fecha de inicio del arrendamiento.
        fecha_fin (date): Fecha de finalización del arrendamiento.
        quintales (float): Cantidad de quintales acordados.
        hectareas (float): Cantidad de hectáreas arrendadas.
        plazo_pago (PlazoPago): Plazo de pago establecido.
        dias_promedio (TipoDiasPromedio): Tipo de cálculo para días promedio.
        origen_precio (TipoOrigenPrecio): Origen del precio de referencia.
        porcentaje_aparceria (Optional[float]): Porcentaje de aparcería, si aplica.
        descripcion (Optional[str]): Descripción adicional del arrendamiento.
    """
    tipo: TipoArrendamiento
    localidad_id: int
    usuario_id: int
    arrendatario_id: int
    fecha_inicio: date
    fecha_fin: date
    quintales: float
    hectareas: float
    plazo_pago: PlazoPago
    dias_promedio: TipoDiasPromedio
    origen_precio: TipoOrigenPrecio
    porcentaje_aparceria: Optional[float]
    descripcion: Optional[str]
    
    model_config = {
        "from_attributes": True,     
        "use_enum_values": True        
    }
    
class ArrendamientoDtoOut(BaseModel):
    """
    DTO de salida para representar un arrendamiento.
    Atributos:
        id (int): Identificador único del arrendamiento.
        estado (EstadoArrendamiento): Estado actual del arrendamiento.
        tipo (TipoArrendamiento): Tipo de arrendamiento.
        localidad (LocalidadDtoOut): Información de la localidad.
        usuario (UsuarioDtoOut): Información del usuario.
        arrendatario (ArrendatarioDtoOut): Información del arrendatario.
        fecha_inicio (date): Fecha de inicio.
        fecha_fin (date): Fecha de fin.
        quintales (float): Quintales acordados.
        hectareas (float): Hectáreas arrendadas.
        plazo_pago (PlazoPago): Plazo de pago.
        dias_promedio (TipoDiasPromedio): Tipo de días promedio.
        origen_precio (TipoOrigenPrecio): Origen del precio.
        porcentaje_aparceria (Optional[float]): Porcentaje de aparcería.
        descripcion (Optional[str]): Descripción.
        arrendadores (list[ArrendadorDtoOut]): Lista de arrendadores asociados.
    """
    id: int
    estado: EstadoArrendamiento
    tipo: TipoArrendamiento
    localidad: LocalidadDtoOut
    usuario: UsuarioDtoOut
    arrendatario: ArrendatarioDtoOut
    fecha_inicio: date
    fecha_fin: date
    quintales: float
    hectareas: float
    plazo_pago: PlazoPago
    dias_promedio: TipoDiasPromedio
    origen_precio: TipoOrigenPrecio
    porcentaje_aparceria: Optional[float]
    descripcion: Optional[str]
    arrendadores: list[ArrendadorDtoOut] = []

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True      
    }
    
class ArrendamientoDtoModificacion(BaseModel):
    """
    DTO para la modificación de un arrendamiento.
    Atributos:
        estado (Optional[EstadoArrendamiento]): Nuevo estado del arrendamiento.
        descripcion (Optional[str]): Nueva descripción.
    """
    estado: Optional[EstadoArrendamiento]
    descripcion: Optional[str]

    model_config = {
        "from_attributes": True,     
        "use_enum_values": True         
    }