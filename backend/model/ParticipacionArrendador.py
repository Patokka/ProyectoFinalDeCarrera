from backend.model.Arrendador import Arrendador
from backend.model.Arrendamiento import Arrendamiento


class ParticipacionArrendador:
    hectareas_asignadas: float
    quintales_asignados: float
    porcentaje: float
    observacion: str
    arrendador: Arrendador
    arrendamiento: Arrendamiento