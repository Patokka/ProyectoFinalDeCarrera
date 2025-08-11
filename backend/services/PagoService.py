from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from backend.enums.EstadoPago import EstadoPago
from backend.enums.PlazoPago import PlazoPago
from backend.enums.TipoArrendamiento import TipoArrendamiento
from backend.enums.TipoDiasPromedio import TipoDiasPromedio
from backend.enums.TipoOrigenPrecio import TipoOrigenPrecio
from backend.model.Precio import Precio
from backend.model.Arrendamiento import Arrendamiento
from backend.services import PrecioService
from ..services.ArrendamientoService import ArrendamientoService
from ..model.Pago import Pago
from ..dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion
from datetime import date, timedelta
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
    def _sumar_meses(fecha: date, meses: int) -> date:
        """Suma meses a una fecha manteniendo día y ajustando año."""
        mes = fecha.month - 1 + meses
        anio = fecha.year + mes // 12
        mes = mes % 12 + 1
        dia = min(fecha.day, [31,
                              29 if anio % 4 == 0 and (anio % 100 != 0 or anio % 400 == 0) else 28,
                              31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes-1])
        return date(anio, mes, dia)

    @staticmethod
    def generarCuotas(db: Session, arrendamiento_id: int):
        """
        Genera cuotas de pago en función de las participaciones.
        - FIJO: genera cuotas completas con quintales calculados.
        - A_PORCENTAJE: genera cuotas con vencimientos iguales pero sin quintales.
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db=db, arrendamiento_id= arrendamiento_id)
        
        # Obtener participaciones
        participaciones = db.query(ParticipacionArrendador).filter_by(arrendamiento_id=arrendamiento.id).all()
        if not participaciones:
            raise ValueError("No hay participaciones registradas para este arrendamiento.")

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

        cuotas = []

        for participacion in participaciones:
            fecha_actual = PagoService._sumar_meses(arrendamiento.fecha_inicio, meses_por_cuota)

            while fecha_actual <= arrendamiento.fecha_fin:
                if arrendamiento.tipo == TipoArrendamiento.FIJO:
                    quintales_pago = participacion.hectareas_asignadas * participacion.quintales_asignados
                else:  # A_PORCENTAJE
                    quintales_pago = None

                cuotas.append(Pago(
                    estado=EstadoPago.PENDIENTE,
                    quintales=quintales_pago,
                    precio_promedio=None,
                    vencimiento=fecha_actual,
                    fuente_precio=arrendamiento.origen_precio,
                    monto_a_pagar=None,
                    arrendamiento_id=arrendamiento.id,
                    participacion_arrendador_id=participacion.id
                ))
                fecha_actual = PagoService._sumar_meses(fecha_actual, meses_por_cuota)

        db.add_all(cuotas)
        db.commit()
        return cuotas
    
    @staticmethod
    def generarPrecioCuota(db: Session, pago_id: int):
        pago = db.query(Pago).options(joinedload(Pago.arrendamiento)).get(pago_id)
        fecha_inicio, fecha_fin = PagoService._calcular_rango_precio(pago.arrendamiento.dias_promedio, pago.vencimiento)

        precios = db.query(Precio.precio_obtenido)\
                    .filter(Precio.origen == pago.fuente_precio,
                            Precio.fecha_precio >= fecha_inicio,
                            Precio.fecha_precio <= fecha_fin)\
                    .all()

        precios = [p[0] for p in precios]
        if not precios:
            raise ValueError(f"No hay precios para {pago.fuente_precio} entre {fecha_inicio} y {fecha_fin}")

        precio_promedio = sum(precios) / len(precios)
        pago.precio_promedio = precio_promedio
        if pago.quintales is not None:
            pago.monto_a_pagar = precio_promedio * pago.quintales

        db.commit()
        db.refresh(pago)
        return pago

    @staticmethod
    def _calcular_rango_precio(dias_promedio: TipoDiasPromedio, fecha_venc: date):
        """
        Retorna (fecha_inicio, fecha_fin) para buscar precios.
        """
        mes_anterior = fecha_venc.replace(day=1) - timedelta(days=1)

        if dias_promedio == TipoDiasPromedio.ULTIMOS_5_HABILES:
            fecha_fin = mes_anterior
            fecha_inicio = PagoService._restar_dias_habiles(fecha_fin, 4)
        elif dias_promedio == TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL:
            fecha_inicio = mes_anterior.replace(day=10)
            fecha_fin = mes_anterior.replace(day=15)
        elif dias_promedio == TipoDiasPromedio.ULTIMOS_10_HABILES:
            fecha_fin = mes_anterior
            fecha_inicio = PagoService._restar_dias_habiles(fecha_fin, 9)
        else:
            raise ValueError(f"Días promedio '{dias_promedio}' no soportado.")

        return fecha_inicio, fecha_fin

    @staticmethod
    def _restar_dias_habiles(fecha: date, cantidad: int):
        """
        Resta días hábiles desde una fecha dada (sin contar fines de semana).
        """
        dias_restados = 0
        fecha_actual = fecha
        while dias_restados < cantidad:
            fecha_actual -= timedelta(days=1)
            if fecha_actual.weekday() < 5:  # lunes-viernes
                dias_restados += 1
        return fecha_actual

    @staticmethod
    def actualizar_precios_diarios(db: Session):
        hoy = date.today()

        # Evitar duplicar si ya existe precio de hoy para esa fuente
        fuentes = [TipoOrigenPrecio.BCR, TipoOrigenPrecio.AGD]
        for fuente in fuentes:
            existe = db.query(Precio).filter(Precio.origen == fuente, Precio.fecha_consulta == hoy).first()
            if existe:
                continue  # Ya cargado hoy para esa fuente

            valor = None
            if fuente == TipoOrigenPrecio.BCR:
                valor = PrecioService.obtener_precio_bcr()
            elif fuente == TipoOrigenPrecio.AGD:
                valor = PrecioService.obtener_precio_agd()

            if valor is not None:
                nuevo_precio = Precio(
                    origen=fuente,
                    valor=valor,
                    fecha=hoy
                )
                db.add(nuevo_precio)

        db.commit()
