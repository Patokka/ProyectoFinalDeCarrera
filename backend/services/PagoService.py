from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.enums.EstadoPago import EstadoPago
from backend.enums.PlazoPago import PlazoPago
from backend.enums.TipoArrendamiento import TipoArrendamiento
from backend.model.Arrendamiento import Arrendamiento
from ..model.Pago import Pago
from ..dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion
from datetime import date, datetime
from sqlalchemy.orm import Session
from backend.model.ParticipacionArrendador import ParticipacionArrendador

class PagoService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Pago).all()

    @staticmethod
    def obtener_por_id(db: Session, pago_id: int):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return obj

    @staticmethod
    def crear(db: Session, dto: PagoDto):
        nuevo = Pago(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, pago_id: int, dto: PagoDtoModificacion):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, pago_id: int):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def _sumar_meses_date(fecha: date, meses: int) -> date:
        """
        Suma meses a una fecha tipo date manteniendo el día si es posible.
        """
        mes = fecha.month - 1 + meses
        anio = fecha.year + mes // 12
        mes = mes % 12 + 1
        dia = min(
            fecha.day,
            [31,
            29 if anio % 4 == 0 and (anio % 100 != 0 or anio % 400 == 0) else 28,
            31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1]
        )
        return date(anio, mes, dia)
        
    @staticmethod
    def generarCuotas(db: Session, arrendamiento: Arrendamiento):
        """
        Genera cuotas según el tipo de arrendamiento:
        - FIJO: quintales iguales en cada cuota.
        - APARCERIA_SIMPLE: un único porcentaje aplicado en una cuota o varias cuotas iguales.
        - APARCERIA_PERSONALIZADA: porcentajes distintos por cuota.
        La primer cuota vence en fecha_inicio + meses_por_cuota.
        """
        # Mapeo de periodicidad
        periodos = {
            PlazoPago.MENSUAL: 1,
            PlazoPago.BIMESTRAL: 2,
            PlazoPago.TRIMESTRAL: 3,
            PlazoPago.CUATRIMESTRAL: 4,
            PlazoPago.SEMESTRAL: 6,
            PlazoPago.ANUAL: 12
        }

        meses_por_cuota = periodos.get(arrendamiento.plazo_pago)
        if not meses_por_cuota:
            raise ValueError(f"Periodicidad '{arrendamiento.plazo_pago}' no soportada.")

        # La primer fecha de cuota es fecha_inicio + meses_por_cuota
        fecha_actual = PagoService._sumar_meses_date(arrendamiento.fecha_inicio, meses_por_cuota)
        cuotas = []

        if arrendamiento.tipo == TipoArrendamiento.FIJO:
            while fecha_actual <= arrendamiento.fecha_fin:
                fecha_vencimiento = fecha_actual
                fecha_actual = PagoService._sumar_meses_date(fecha_actual, meses_por_cuota)

                cuotas.append(Pago(
                    estado=EstadoPago.PENDIENTE,
                    quintales=arrendamiento.quintales,
                    precio_promedio=None,
                    vencimiento=fecha_vencimiento,
                    fuente_precio=None,
                    monto_a_pagar=None,
                    arrendamiento_id=arrendamiento.id
                ))

        elif arrendamiento.tipo == TipoArrendamiento.A_PORCENTAJE:
            # Ignoramos porcentajes para la generación de cuotas
            while fecha_actual <= arrendamiento.fecha_fin:
                fecha_vencimiento = fecha_actual
                fecha_actual = PagoService._sumar_meses_date(fecha_actual, meses_por_cuota)

                cuotas.append(Pago(
                    estado=EstadoPago.PENDIENTE,
                    quintales=None,  # Se cargará cuando se conozca producción real
                    precio_promedio=None,
                    vencimiento=fecha_vencimiento,
                    fuente_precio=None,
                    monto_a_pagar=None,
                    arrendamiento_id=arrendamiento.id
                ))
        else:
            raise ValueError(f"Tipo de arrendamiento '{arrendamiento.tipo}' no soportado.")

        db.add_all(cuotas)
        db.commit()
        return cuotas

