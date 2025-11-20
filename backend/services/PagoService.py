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
        # Obtener participaciones
        participaciones = db.query(ParticipacionArrendador).filter_by(arrendamiento_id=arrendamiento.id).all()
        if not participaciones:
            raise HTTPException(status_code=400, detail="No hay participaciones registradas para este arrendamiento.")
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
            raise HTTPException(status_code=400, detail=f"Periodicidad '{arrendamiento.plazo_pago}' no soportada.") 
        DOS_DECIMALES = Decimal('0.01')
        D_DOCE = Decimal('12')
        D_MESES_POR_CUOTA = Decimal(str(meses_por_cuota))
        cuotas = []
        for participacion in participaciones:
            fecha_actual = arrendamiento.fecha_inicio
            fechas_cuotas = []
            while fecha_actual <= arrendamiento.fecha_fin:
                fechas_cuotas.append(fecha_actual)
                fecha_actual = PagoService._sumar_meses(fecha_actual, meses_por_cuota)  
            cantidad_cuotas = len(fechas_cuotas)
            if cantidad_cuotas == 0:
                continue 
            lista_quintales_cuota = []
            lista_porcentaje_cuota = []
            dias_promedio_pago = None
            if arrendamiento.tipo == TipoArrendamiento.FIJO:
                hectareas = Decimal(str(participacion.hectareas_asignadas))
                quintales_ha = Decimal(str(participacion.quintales_asignados))
                quintales_anuales = hectareas * quintales_ha
                quintales_mensuales = quintales_anuales / D_DOCE
                quintales_pago_exacto = quintales_mensuales * D_MESES_POR_CUOTA
                quintales_pago_redondeado = quintales_pago_exacto.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)
                lista_quintales_cuota = [quintales_pago_redondeado] * cantidad_cuotas
                lista_porcentaje_cuota = [None] * cantidad_cuotas
                dias_promedio_pago = arrendamiento.dias_promedio
            else:  
                porcentaje_anual = Decimal(str(participacion.porcentaje))
                if D_MESES_POR_CUOTA == 0:
                    raise HTTPException(status_code=400, detail="Meses por cuota no puede ser cero.")
                cuotas_por_anio = D_DOCE / D_MESES_POR_CUOTA                
                if cuotas_por_anio == 0:
                    raise HTTPException(status_code=400, detail="Cálculo de cuotas por año resultó en cero.")
                porcentaje_por_cuota_exacto = porcentaje_anual / cuotas_por_anio
                porcentaje_por_cuota_redondeado = porcentaje_por_cuota_exacto.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)
                lista_porcentaje_cuota = [porcentaje_por_cuota_redondeado] * cantidad_cuotas
                lista_quintales_cuota = [None] * cantidad_cuotas # Rellenar con None
                dias_promedio_pago = None
            for i, fecha_vencimiento in enumerate(fechas_cuotas):
                if(hoy > fecha_vencimiento):
                    estado_pago = EstadoPago.VENCIDO
                else:
                    estado_pago = EstadoPago.PENDIENTE
                # Obtener los valores de las listas
                quintales_pago = None
                if lista_quintales_cuota[i] is not None:
                    quintales_pago = float(lista_quintales_cuota[i])
                porcentaje_pago = None
                if lista_porcentaje_cuota[i] is not None:
                    porcentaje_pago = float(lista_porcentaje_cuota[i])
                cuotas.append(Pago(
                    estado=estado_pago,
                    quintales=quintales_pago,
                    precio_promedio=None,
                    vencimiento=fecha_vencimiento,
                    fuente_precio=arrendamiento.origen_precio,
                    monto_a_pagar=None,
                    arrendamiento_id=arrendamiento.id,
                    participacion_arrendador_id=participacion.id,
                    dias_promedio = dias_promedio_pago,
                    porcentaje = porcentaje_pago
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

        match pago.arrendamiento.dias_promedio:
            case TipoDiasPromedio.ULTIMOS_5_HABILES:
                precios = query_base.order_by(Precio.fecha_precio.desc()).limit(5).all()
                if not precios:
                    raise HTTPException(status_code=400, detail=f"No hay precios requeridos para el origen {pago.fuente_precio.name}' en {mes_anterior}/{anio_anterior}.")

                if len(precios) < 5:
                    faltan = 5 - len(precios)
                    precios_extra = db.query(Precio).filter(
                        Precio.origen == pago.fuente_precio,
                        Precio.fecha_precio < precios[-1].fecha_precio
                    ).order_by(Precio.fecha_precio.desc()).limit(faltan).all()
                    precios.extend(precios_extra)

            case TipoDiasPromedio.ULTIMOS_10_HABILES:
                precios = query_base.order_by(Precio.fecha_precio.desc()).limit(10).all()
                if not precios:
                    raise HTTPException(status_code=400, detail=f"No hay precios requeridos para el origen {pago.fuente_precio.name}' en {mes_anterior}/{anio_anterior}.")

                if len(precios) < 10:
                    faltan = 10 - len(precios)
                    precios_extra = db.query(Precio).filter(
                        Precio.origen == pago.fuente_precio,
                        Precio.fecha_precio < precios[-1].fecha_precio
                    ).order_by(Precio.fecha_precio.desc()).limit(faltan).all()
                    precios.extend(precios_extra)

            case TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL:
                precios = db.query(Precio).filter(
                    Precio.origen == pago.fuente_precio,
                    extract("month", Precio.fecha_precio) == vencimiento.month,
                    extract("year", Precio.fecha_precio) == vencimiento.year,
                    extract("day", Precio.fecha_precio) >= 10,
                    extract("day", Precio.fecha_precio) <= 15
                ).order_by(Precio.fecha_precio).all()

                if not precios:
                    raise HTTPException(status_code=400, detail=f"No hay precios requeridos para el origen {pago.fuente_precio.name}' en {mes_anterior}/{anio_anterior}.")

            case TipoDiasPromedio.ULTIMO_MES:
                precios = query_base.order_by(Precio.fecha_precio).all()
                if not precios:
                    raise HTTPException(status_code=400, detail=f"No hay precios requeridos para el origen {pago.fuente_precio.name}' en {mes_anterior}/{anio_anterior}.")

            case _:
                raise HTTPException(status_code=400, detail=f"Tipo de dias_promedio '{pago.arrendamiento.dias_promedio}' no soportado.")

        # Convertimos a Decimal para preservar precisión
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
        
        if pago.porcentaje and pago.porcentaje> 0:
            raise HTTPException(status_code=400, detail="No se le puede asignar un precio a un pago de porcentaje de producción")
        
        if (pago.precio_promedio is not None and pago.precio_promedio > 0) or (pago.monto_a_pagar is not None and pago.monto_a_pagar > 0):
            raise HTTPException(status_code=400, detail="El pago ya tiene un monto y precio calculado.")
        
        precio_promedio, precios_en_rango = PagoService._obtener_precios_promedio(db, pago)
        
        pago.precio_promedio = (precio_promedio / Decimal("10"))
        
        if pago.quintales is not None:
            pago.monto_a_pagar = pago.precio_promedio * Decimal(str(pago.quintales))

        #Asignar precios a la relación many-to-many
        pago.precios.extend(precios_en_rango)

        db.commit()
        db.refresh(pago)
        return pago
    
    
    @staticmethod
    def generarPreciosCuotasMensual(db: Session):
        """
        Job periódico asignarle el precio a las cuotas del mes actual
        y que toman precios del mes anterior, además son cuotas de pago
        y no de entrega de producción por eso se sacan las que tienen quintales = None
        """
        hoy = date.today()
        anio, mes = hoy.year, hoy.month

        # Rango del mes actual
        fecha_inicio = date(anio, mes, 1)
        fecha_fin = date(anio + (mes // 12), (mes % 12) + 1, 1)

        # Traer pagos del mes
        pagos = (
            db.query(Pago)
            .filter(
                Pago.vencimiento >= fecha_inicio,
                Pago.vencimiento < fecha_fin,
                Pago.estado == EstadoPago.PENDIENTE
            ).all()
        )
        contador = 0
        for pago in pagos:
            #Excluir cuotas especiales
            if pago.dias_promedio == TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL:
                continue
            if pago.quintales is None or pago.porcentaje > 0:
                continue
            contador+=1
            print(f"----Calculando precio a pago de id: {pago.id}")
            #Aplicar el cálculo de precio de la cuota
            PagoService.generarPrecioCuota(db, pago.id)

        db.commit()
        print(f"✅[{hoy}] Job de actualización: precios de cuotas actualizados para mes {mes}-{anio}: {contador}.")
        
    @staticmethod
    def generarPrecioCuotas10a15(db: Session):
        """
        Genera el precio de las cuotas que tienen como forma de calcular
        el precio promedio los precios ubicados entre el 10 y el 15 de cada mes.
        Se utilizará este método una vez por mes el día 16.
        """
        hoy = date.today()
        anio, mes = hoy.year, hoy.month

        # Rango del mes actual
        fecha_inicio = date(anio, mes, 1)
        fecha_fin = date(anio + (mes // 12), (mes % 12) + 1, 1)
        pagos = (
            db.query(Pago)
            .filter(
                Pago.vencimiento >= fecha_inicio,
                Pago.vencimiento < fecha_fin,
                Pago.estado == EstadoPago.PENDIENTE,
                Pago.dias_promedio == TipoDiasPromedio.DEL_10_AL_15_MES_ACTUAL,
                Pago.quintales.isnot(None)
            )
        )
        for pago in pagos:
            print(f"----Calculando precio a pago de id: {pago.id}")
            #Aplicar el cálculo de precio de la cuota
            PagoService.generarPrecioCuota(db, pago.id)

        db.commit()
        print(f"✅[{hoy}] Job de actualización: precios de cuotas actualizados para mes {mes}-{anio}: {len(pagos)}.")


    @staticmethod
    def actualizarPagosVencidos(db: Session):
        """
        Marca como VENCIDO todos los pagos con vencimiento en el día de ayer
        que aún estén en estado PENDIENTE.
        """
        hoy = date.today()
        ayer = hoy - timedelta(days=1)

        # Buscar pagos pendientes con vencimiento ayer
        pagos = (
            db.query(Pago)
            .filter(
                Pago.vencimiento == ayer,
                Pago.estado == EstadoPago.PENDIENTE
            ).all()
        )

        if not pagos:
            print(f"✅ No se encontraron pagos VENCIDOS para {ayer}.")
            return

        for pago in pagos:
            pago.estado = EstadoPago.VENCIDO

        db.commit()
        print(f"✅[{hoy}] Job de actualización: Se actualizaron {len(pagos)} pagos como VENCIDOS para la fecha {ayer}.")
        
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
            )
            .join(Arrendamiento, Pago.arrendamiento_id == Arrendamiento.id)
            .join(Arrendatario, Arrendamiento.arrendatario_id == Arrendatario.id)
            .filter(extract("year", Pago.vencimiento) == today.year)
            .filter(extract("month", Pago.vencimiento) == today.month)
            .filter(Pago.estado.in_(["PENDIENTE", "VENCIDO"]))
            .group_by(Arrendatario.razon_social)
            .all()
        )
        
        response = [
            {
                "arrendatario": r.arrendatario,
                "cantidad": int(r.cantidad) if r.cantidad is not None else 0,
                "monto": float(r.monto) if r.monto is not None else 0
            }
            for r in results
        ]

        return response
    
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
        
        proximo_mes = proximo_mes_fecha.month
        proximo_mes_ano = proximo_mes_fecha.year

        results = (
            db.query(
                Arrendatario.razon_social.label("arrendatario"),
                func.count(Pago.id).label("cantidad"),
                func.sum(Pago.quintales).label("quintales")
            )
            .join(Arrendamiento, Pago.arrendamiento_id == Arrendamiento.id)
            .join(Arrendatario, Arrendamiento.arrendatario_id == Arrendatario.id)
            .filter(extract("year", Pago.vencimiento) == proximo_mes_ano)
            .filter(extract("month", Pago.vencimiento) == proximo_mes)
            .filter(Pago.estado.in_(["PENDIENTE"]))
            .group_by(Arrendatario.razon_social)
            .all()
        )
        
        response = [
            {
                "arrendatario": r.arrendatario,
                "cantidad": int(r.cantidad) if r.cantidad is not None else 0,
                "quintales": float(r.quintales) if r.quintales is not None else 0
            }
            for r in results
        ]

        return response
    
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
        results = (
            db.query(Pago.vencimiento, Pago.estado)
            .filter(extract("month", Pago.vencimiento) == mes)
            .filter(extract("year", Pago.vencimiento) == anio)
            .all()
        )
        response = []
        for r in results:
            if r.vencimiento is None:
                continue  # o poner una fecha por defecto
            response.append({
                "fecha": r.vencimiento.strftime("%Y-%m-%d"),
                "estado": r.estado
            })
        return response

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
        pagos = (
            db.query(Pago)
            .join(Pago.participacion_arrendador)
            .filter(
                (ParticipacionArrendador.arrendador_id == arrendador_id) &
                (Pago.estado == EstadoPago.PENDIENTE)
            )
            .all()
        )
        return pagos

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
        arrendamiento = ArrendamientoService.obtener_por_id(db=db, arrendamiento_id= arrendamiento_id)
        resultados = db.query(Pago).filter(Pago.arrendamiento_id == arrendamiento_id).all()
        return resultados
    
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