from decimal import ROUND_HALF_UP, Decimal
from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy import asc, extract, func
from sqlalchemy.orm import Session, joinedload
from model.Arrendamiento import Arrendamiento
from model.Arrendatario import Arrendatario
from enums.EstadoPago import EstadoPago
from enums.PlazoPago import PlazoPago
from enums.TipoArrendamiento import TipoArrendamiento
from enums.TipoDiasPromedio import TipoDiasPromedio
from model.Precio import Precio
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Pago import Pago
from services.ArrendamientoService import ArrendamientoService
from dtos.PagoDto import PagoDto, PagoDtoModificacion
from datetime import date, timedelta


class PagoService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de pagos y cuotas.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todos los pagos de la base de datos, ordenados por fecha de vencimiento.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Pago]: Una lista de todos los pagos.
        """
        return db.query(Pago).order_by(asc(Pago.vencimiento)).all()

    @staticmethod
    def obtener_por_id(db: Session, pago_id: int):
        """
        Obtiene un pago por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago a buscar.

        Returns:
            Pago: El pago encontrado.

        Raises:
            HTTPException: Si el pago no se encuentra (código 404).
        """
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")
        return obj

    @staticmethod
    def crear(db: Session, dto: PagoDto):
        """
        Crea un nuevo pago en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (PagoDto): Los datos del pago a crear.

        Returns:
            Pago: El pago recién creado.
        """
        nuevo = Pago(**dto.model_dump())
        if(dto.vencimiento <= date.today()):
            nuevo.estado = EstadoPago.VENCIDO            
        else:
            nuevo.estado = EstadoPago.PENDIENTE
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, pago_id: int, dto: PagoDtoModificacion):
        """
        Actualiza los datos de un pago existente.

        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago a actualizar.
            dto (PagoDtoModificacion): Los datos a modificar.

        Returns:
            Pago: El pago actualizado.

        Raises:
            HTTPException: Si el pago no se encuentra (código 404).
        """
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        if(dto.vencimiento < date.today()):
            obj.estado = EstadoPago.VENCIDO
        else:
            obj.estado = EstadoPago.PENDIENTE
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, pago_id: int):
        """
        Elimina un pago de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago a eliminar.

        Raises:
            HTTPException: Si el pago no se encuentra (404) o si tiene
                           relaciones que impiden su eliminación.
        """
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def _sumar_meses(fecha: date, meses: int) -> date:
        """
        Función auxiliar para sumar una cantidad de meses a una fecha.

        Args:
            fecha (date): La fecha inicial.
            meses (int): El número de meses a sumar.

        Returns:
            date: La nueva fecha calculada.
        """
        mes = fecha.month - 1 + meses
        anio = fecha.year + mes // 12
        mes = mes % 12 + 1
        dia = min(fecha.day, [31, 29 if anio % 4 == 0 and (anio % 100 != 0 or anio % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes-1])
        return date(anio, mes, dia)

    @staticmethod
    def generarCuotas(db: Session, arrendamiento_id: int):
        """
        Genera automáticamente las cuotas de pago para un arrendamiento.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento.

        Returns:
            list[Pago]: La lista de cuotas generadas.

        Raises:
            HTTPException: Si no hay participaciones o la periodicidad no es válida.
        """
        hoy = date.today()
        arrendamiento = ArrendamientoService.obtener_por_id(db=db, arrendamiento_id=arrendamiento_id)
        participaciones = db.query(ParticipacionArrendador).filter_by(arrendamiento_id=arrendamiento.id).all()
        if not participaciones:
            raise HTTPException(status_code=400, detail="No hay participaciones registradas para este arrendamiento.")
        periodos = {
            PlazoPago.MENSUAL: 1, PlazoPago.BIMESTRAL: 2, PlazoPago.TRIMESTRAL: 3,
            PlazoPago.CUATRIMESTRAL: 4, PlazoPago.SEMESTRAL: 6, PlazoPago.ANUAL: 12
        }
        meses_por_cuota = periodos.get(arrendamiento.plazo_pago)
        if not meses_por_cuota:
            raise HTTPException(status_code=400, detail=f"Periodicidad '{arrendamiento.plazo_pago}' no soportada.") 

        cuotas = []
        for participacion in participaciones:
            fecha_actual = arrendamiento.fecha_inicio
            fechas_cuotas = []
            while fecha_actual <= arrendamiento.fecha_fin:
                fechas_cuotas.append(fecha_actual)
                fecha_actual = PagoService._sumar_meses(fecha_actual, meses_por_cuota)  

            for fecha_vencimiento in fechas_cuotas:
                estado_pago = EstadoPago.VENCIDO if hoy > fecha_vencimiento else EstadoPago.PENDIENTE

                quintales_pago, porcentaje_pago = None, None
                if arrendamiento.tipo == TipoArrendamiento.FIJO:
                    quintales_anuales = Decimal(str(participacion.hectareas_asignadas)) * Decimal(str(participacion.quintales_asignados))
                    quintales_pago = float((quintales_anuales / Decimal('12') * Decimal(str(meses_por_cuota))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
                else:
                    cuotas_por_anio = Decimal('12') / Decimal(str(meses_por_cuota))
                    porcentaje_pago = float((Decimal(str(participacion.porcentaje)) / cuotas_por_anio).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

                cuotas.append(Pago(
                    estado=estado_pago, quintales=quintales_pago, vencimiento=fecha_vencimiento,
                    fuente_precio=arrendamiento.origen_precio, arrendamiento_id=arrendamiento.id,
                    participacion_arrendador_id=participacion.id, porcentaje=porcentaje_pago,
                    dias_promedio = arrendamiento.dias_promedio if arrendamiento.tipo == TipoArrendamiento.FIJO else None
                ))
        db.add_all(cuotas)
        db.commit()
        return cuotas

    @staticmethod
    def _obtener_precios_promedio(db: Session, pago: "Pago"):
        """
        Calcula el precio promedio para un pago basándose en su configuración de `dias_promedio`.

        Args:
            db (Session): La sesión de la base de datos.
            pago (Pago): El objeto de pago.

        Returns:
            tuple[Decimal, list[Precio]]: El precio promedio calculado y la lista de precios utilizados.
        """
        vencimiento = pago.vencimiento
        mes_anterior = (vencimiento.replace(day=1) - timedelta(days=1)).month
        anio_anterior = (vencimiento.replace(day=1) - timedelta(days=1)).year

        query_base = db.query(Precio).filter(
            Precio.origen == pago.fuente_precio,
            extract("month", Precio.fecha_precio) == mes_anterior,
            extract("year", Precio.fecha_precio) == anio_anterior
        )
        precios = []

        if pago.arrendamiento.dias_promedio in [TipoDiasPromedio.ULTIMOS_5_HABILES, TipoDiasPromedio.ULTIMOS_10_HABILES]:
            limit = 5 if pago.arrendamiento.dias_promedio == TipoDiasPromedio.ULTIMOS_5_HABILES else 10
            precios = query_base.order_by(Precio.fecha_precio.desc()).limit(limit).all()
            # Lógica para completar si faltan precios...
        elif pago.arrendamiento.dias_promedio == TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL:
            precios = db.query(Precio).filter(...).all() # Query original
        elif pago.arrendamiento.dias_promedio == TipoDiasPromedio.ULTIMO_MES:
            precios = query_base.order_by(Precio.fecha_precio).all()
        else:
            raise HTTPException(status_code=400, detail=f"Tipo de dias_promedio no soportado.")

        if not precios:
            raise HTTPException(status_code=400, detail=f"No hay precios requeridos para el origen.")

        total = sum(Decimal(p.precio_obtenido) for p in precios)
        precio_promedio = (total / Decimal(len(precios))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return precio_promedio, precios

    @staticmethod
    def generarPrecioCuota(db: Session, pago):
        """
        Calcula y asigna el precio promedio y el monto a pagar a una cuota específica.

        Args:
            db (Session): La sesión de la base de datos.
            pago (int | Pago): El ID del pago o el objeto Pago.

        Returns:
            Pago: El pago actualizado con el precio y monto.
        """
        if isinstance(pago, int):
            pago = db.query(Pago).options(joinedload(Pago.arrendamiento)).get(pago)
        if not pago:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")
        if pago.porcentaje and pago.porcentaje > 0:
            raise HTTPException(status_code=400, detail="No se le puede asignar un precio a un pago de porcentaje.")
        if (pago.precio_promedio and pago.precio_promedio > 0) or (pago.monto_a_pagar and pago.monto_a_pagar > 0):
            raise HTTPException(status_code=400, detail="El pago ya tiene un monto y precio calculado.")
        
        precio_promedio, precios_en_rango = PagoService._obtener_precios_promedio(db, pago)
        pago.precio_promedio = (precio_promedio / Decimal("10"))
        if pago.quintales is not None:
            pago.monto_a_pagar = pago.precio_promedio * Decimal(str(pago.quintales))
        pago.precios.extend(precios_en_rango)

        db.commit()
        db.refresh(pago)
        return pago
    
    @staticmethod
    def generarPreciosCuotasMensual(db: Session):
        """
        Job periódico para asignar precios a las cuotas del mes actual que dependen de precios del mes anterior.
        """
        hoy = date.today()
        pagos = db.query(Pago).filter(
            extract("year", Pago.vencimiento) == hoy.year,
            extract("month", Pago.vencimiento) == hoy.month,
            Pago.estado == EstadoPago.PENDIENTE,
            Pago.dias_promedio != TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL,
            Pago.quintales.isnot(None),
            Pago.porcentaje.is_(None) # O `Pago.porcentaje == 0` si es el caso
        ).all()

        for pago in pagos:
            try:
                PagoService.generarPrecioCuota(db, pago)
            except HTTPException as e:
                print(f"No se pudo calcular precio para pago {pago.id}: {e.detail}")
        db.commit()
        print(f"✅[{hoy}] Job de actualización: precios de cuotas actualizados.")

    @staticmethod
    def generarPrecioCuotas10a15(db: Session):
        """
        Job periódico (día 16 del mes) para asignar precios a las cuotas que promedian del 10 al 15 del mes actual.
        """
        hoy = date.today()
        pagos = db.query(Pago).filter(
            extract("year", Pago.vencimiento) == hoy.year,
            extract("month", Pago.vencimiento) == hoy.month,
            Pago.estado == EstadoPago.PENDIENTE,
            Pago.dias_promedio == TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL,
            Pago.quintales.isnot(None)
        ).all()
        for pago in pagos:
            try:
                PagoService.generarPrecioCuota(db, pago)
            except HTTPException as e:
                print(f"No se pudo calcular precio para pago {pago.id}: {e.detail}")

        db.commit()
        print(f"✅[{hoy}] Job de actualización: precios de cuotas (10-15) actualizados.")

    @staticmethod
    def actualizarPagosVencidos(db: Session):
        """
        Job periódico que marca como 'VENCIDO' los pagos pendientes cuya fecha de vencimiento ya pasó.
        """
        hoy = date.today()
        ayer = hoy - timedelta(days=1)
        pagos = db.query(Pago).filter(Pago.vencimiento == ayer, Pago.estado == EstadoPago.PENDIENTE).all()
        for pago in pagos:
            pago.estado = EstadoPago.VENCIDO
        db.commit()
        if pagos:
            print(f"✅[{hoy}] Job de actualización: Se actualizaron {len(pagos)} pagos como VENCIDOS.")
        else:
            print(f"✅ No se encontraron pagos VENCIDOS para {ayer}.")

    @staticmethod
    def obtener_pagos_agrupados_mes(db: Session):
        """
        Obtiene un resumen de los pagos pendientes y vencidos del mes actual, agrupados por arrendatario.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[dict]: Lista de diccionarios con el resumen por arrendatario.
        """
        today = date.today()
        results = (
            db.query(
                Arrendatario.razon_social.label("arrendatario"),
                func.count(Pago.id).label("cantidad"),
                func.sum(Pago.monto_a_pagar).label("monto")
            ).join(Arrendamiento).join(Arrendatario)
            .filter(extract("year", Pago.vencimiento) == today.year, extract("month", Pago.vencimiento) == today.month)
            .filter(Pago.estado.in_([EstadoPago.PENDIENTE, EstadoPago.VENCIDO]))
            .group_by(Arrendatario.razon_social).all()
        )
        return [{"arrendatario": r.arrendatario, "cantidad": r.cantidad or 0, "monto": float(r.monto or 0)} for r in results]

    @staticmethod
    def obtener_resumen_quintales_proximo_mes(db: Session):
        """
        Obtiene un resumen de los quintales pendientes de pago para el próximo mes, agrupados por arrendatario.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[dict]: Lista de diccionarios con el resumen por arrendatario.
        """
        today = date.today()
        proximo_mes_fecha = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
        results = (
            db.query(
                Arrendatario.razon_social.label("arrendatario"),
                func.count(Pago.id).label("cantidad"),
                func.sum(Pago.quintales).label("quintales")
            ).join(Arrendamiento).join(Arrendatario)
            .filter(extract("year", Pago.vencimiento) == proximo_mes_fecha.year, extract("month", Pago.vencimiento) == proximo_mes_fecha.month)
            .filter(Pago.estado == EstadoPago.PENDIENTE)
            .group_by(Arrendatario.razon_social).all()
        )
        return [{"arrendatario": r.arrendatario, "cantidad": r.cantidad or 0, "quintales": float(r.quintales or 0)} for r in results]

    @staticmethod
    def obtener_vencimientos_mes(db: Session, mes: int, anio: int):
        """
        Obtiene las fechas y estados de los vencimientos de un mes y año específicos.

        Args:
            db (Session): La sesión de la base de datos.
            mes (int): Mes a consultar.
            anio (int): Año a consultar.

        Returns:
            list[dict]: Lista de diccionarios con fecha y estado.
        """
        results = db.query(Pago.vencimiento, Pago.estado).filter(extract("month", Pago.vencimiento) == mes, extract("year", Pago.vencimiento) == anio).all()
        return [{"fecha": r.vencimiento.strftime("%Y-%m-%d"), "estado": r.estado} for r in results if r.vencimiento]

    @staticmethod
    def obtener_pendientes_arrendador(db:Session, arrendador_id: int):
        """
        Obtiene los pagos pendientes de un arrendador específico.

        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador.

        Returns:
            list[Pago]: Lista de pagos pendientes.
        """
        return db.query(Pago).join(ParticipacionArrendador).filter(
            ParticipacionArrendador.arrendador_id == arrendador_id,
            Pago.estado == EstadoPago.PENDIENTE
        ).all()

    @staticmethod
    def obtener_pagos_arrendamiento(db, arrendamiento_id):
        """
        Obtiene todos los pagos asociados a un arrendamiento.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento.

        Returns:
            list[Pago]: Lista de pagos.
        """
        return db.query(Pago).filter(Pago.arrendamiento_id == arrendamiento_id).all()
    
    @staticmethod
    def cancelar_pago(db, pago_id):
        """
        Cambia el estado de un pago a 'CANCELADO'.

        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago a cancelar.

        Returns:
            Pago: El pago actualizado.

        Raises:
            HTTPException: Si el pago ya está cancelado.
        """
        pago = PagoService.obtener_por_id(db,pago_id)
        if pago.estado == EstadoPago.CANCELADO:
            raise HTTPException(status_code=409, detail="El pago ya se encuentra cancelado")
        pago.estado = EstadoPago.CANCELADO
        db.commit()
        db.refresh(pago)
        return pago
