from datetime import datetime
from backend.Enums.EstadoArrendamiento import EstadoArrendamiento
from backend.Enums.TipoArrendamiento import TipoArrendamiento
from backend.Enums.PlazoPago import PlazoPago
from backend.Enums.TipoDiasPromedio import TipoDiasPromedio
from backend.model.Arrendatario import Arrendatario
from backend.model.Localidad import Localidad
from backend.model.Usuario import Usuario

class Arrendamiento:
    estado: EstadoArrendamiento
    tipo: TipoArrendamiento
    localidad: Localidad
    fecha_inicio: datetime
    fecha_fin: datetime
    duracion_meses: int
    quintales: float
    hectareas: float
    plazo_pago: PlazoPago
    dias_promedio: TipoDiasPromedio
    porcentaje_aparceria: float
    descripcion: str
    usuario: Usuario
    arrendatario: Arrendatario