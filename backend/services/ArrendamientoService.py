from datetime import date, timedelta

from sqlalchemy import asc
from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDto, ParticipacionArrendadorDtoModificacion
from enums.EstadoArrendamiento import EstadoArrendamiento
from enums.EstadoPago import EstadoPago
from model.Pago import Pago
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Arrendamiento import Arrendamiento
from dtos.ArrendamientoDto import ArrendamientoDto, ArrendamientoDtoOut, ArrendamientoDtoModificacion

class ArrendamientoService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de arrendamientos
    y las participaciones de los arrendadores.
    """
    @staticmethod
    def listar_activos(db: Session):
        """
        Obtiene todos los arrendamientos con estado 'ACTIVO'.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[ArrendamientoDtoOut]: Una lista de arrendamientos activos.
        """
        arrendamientos = (
            db.query(Arrendamiento)
            .options(
                joinedload(Arrendamiento.participaciones)
                .joinedload(ParticipacionArrendador.arrendador)
            ).filter(Arrendamiento.estado==EstadoArrendamiento.ACTIVO)
            .all()
        )
        result = []
        for arr in arrendamientos:
            arr_dto = ArrendamientoDtoOut.model_validate(arr)
            arr_dto.arrendadores = [p.arrendador for p in arr.participaciones]
            result.append(arr_dto)

        return result
    
    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todos los arrendamientos de la base de datos, ordenados por fecha de fin.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[ArrendamientoDtoOut]: Una lista de todos los arrendamientos.
        """
        arrendamientos = (
            db.query(Arrendamiento)
            .options(
                joinedload(Arrendamiento.participaciones)
                .joinedload(ParticipacionArrendador.arrendador)
            ).order_by(asc(Arrendamiento.fecha_fin)).all()
        )

        result = []
        for arr in arrendamientos:
            arr_dto = ArrendamientoDtoOut.model_validate(arr)
            arr_dto.arrendadores = [p.arrendador for p in arr.participaciones]
            result.append(arr_dto)

        return result

    @staticmethod
    def obtener_por_id(db: Session, arrendamiento_id: int):
        """
        Obtiene un arrendamiento por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento a buscar.

        Returns:
            Arrendamiento: El arrendamiento encontrado.

        Raises:
            HTTPException: Si el arrendamiento no se encuentra (código 404).
        """
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado.")
        return obj

    @staticmethod
    def crear(db: Session, dto: ArrendamientoDto):
        """
        Crea un nuevo arrendamiento en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (ArrendamientoDto): Los datos del arrendamiento a crear.

        Returns:
            Arrendamiento: El arrendamiento recién creado.
        """
        nuevo = Arrendamiento(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendamiento_id: int, dto: ArrendamientoDtoModificacion):
        """
        Actualiza los datos de un arrendamiento existente.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento a actualizar.
            dto (ArrendamientoDtoModificacion): Los datos a modificar.

        Returns:
            Arrendamiento: El arrendamiento actualizado.

        Raises:
            HTTPException: Si el arrendamiento no se encuentra (código 404).
        """
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, arrendamiento_id: int):
        """
        Elimina un arrendamiento y sus participaciones y pagos asociados.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento a eliminar.

        Raises:
            HTTPException: Si el arrendamiento no está en estado 'CANCELADO' (400) o si
                           tiene pagos no cancelados (400).
        """
        arr = db.query(Arrendamiento).get(arrendamiento_id)
        if arr.estado != EstadoArrendamiento.CANCELADO:
            raise HTTPException(status_code=400, detail="No se puede eliminar el arrendamiento ya que el mismo no está CANCELADO")
        pagos = db.query(Pago).filter(Pago.arrendamiento_id == arrendamiento_id).all()
        for pago in pagos:
            if pago.estado != EstadoPago.CANCELADO:
                raise HTTPException(status_code=400, detail=f"No se puede eliminar el arrendamiento porque existen pagos REALIZADOS y/o PENDIENTES")
        for pago in pagos:
            db.delete(pago)
        for participacion in arr.participaciones:
            db.delete(participacion)
        db.delete(arr)
        db.commit()

    @staticmethod
    def cancelar_arrendamiento(db: Session, arrendamiento_id: int):
        """
        Cambia el estado de un arrendamiento a 'CANCELADO' y cancela todos sus pagos no realizados.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento a cancelar.

        Returns:
            Arrendamiento: El arrendamiento con el estado actualizado.
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db, arrendamiento_id)
        
        pagos = db.query(Pago).filter(Pago.arrendamiento_id == arrendamiento_id).all()
        
        for pago in pagos:
            if pago.estado != EstadoPago.REALIZADO:
                pago.estado = EstadoPago.CANCELADO
        
        arrendamiento.estado = EstadoArrendamiento.CANCELADO
        
        db.commit()        
        return arrendamiento
    
    @staticmethod
    def finalizar_arrendamiento(db: Session, arrendamiento_id: int):
        """
        Finaliza un arrendamiento si todas sus cuotas están pagadas.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento a finalizar.

        Returns:
            Arrendamiento | None: El arrendamiento finalizado, o None si no se pudo finalizar.
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db, arrendamiento_id)

        if arrendamiento.estado == EstadoArrendamiento.CANCELADO:
            return None

        if ArrendamientoService.tieneCuotasPagadas(db, arrendamiento.id):
            arrendamiento.estado = EstadoArrendamiento.FINALIZADO
            db.commit()
            return arrendamiento
        
        return None
    
    @staticmethod
    def tieneCuotasPagadas(db: Session, arrendamiento_id):
        """
        Verifica si todas las cuotas de un arrendamiento han sido pagadas.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento.

        Returns:
            bool: True si todos los pagos están 'REALIZADO', False en caso contrario.
        """
        existe_pendiente = (
            db.query(Pago.id)
            .filter(
                Pago.arrendamiento_id == arrendamiento_id,
                Pago.estado != EstadoPago.REALIZADO
            )
            .first()
        )

        return existe_pendiente is None
        
    @staticmethod
    def actualizarArrendamientosVencidos(db: Session):
        """
        Job periódico que actualiza el estado de los arrendamientos cuya fecha de fin
        ha pasado. Los marca como 'FINALIZADO' si todos los pagos están realizados,
        o como 'VENCIDO' en caso contrario.
        """
        hoy = date.today()
        ayer = hoy - timedelta(days=1)

        arrendamientos = (
            db.query(Arrendamiento)
            .filter(
                Arrendamiento.fecha_fin == ayer,
                Arrendamiento.estado == EstadoArrendamiento.ACTIVO
            ).all()
        )

        if not arrendamientos:
            print(f"✅ No se encontraron arrendamientos VENCIDOS para {ayer}.")
            return

        vencidos = 0
        
        for arrendamiento in arrendamientos:
            if(ArrendamientoService.tieneCuotasPagadas(db, arrendamiento.id)):
                arrendamiento.estado = EstadoArrendamiento.FINALIZADO
            else:
                arrendamiento.estado = EstadoArrendamiento.VENCIDO
                vencidos+=1

        db.commit()
        print(f"✅[{hoy}] Job de actualización: Se actualizaron {len(arrendamientos)-vencidos} arrendamientos como FINALIZADOS  y {vencidos} arrendamientos como VENCIDOS para la fecha {ayer}.")
        
    ############################################
    #OPERACIONES DE PARTICIPACIÓN DE ARRENDADOR#
    ############################################
    @staticmethod
    def listar_participaciones(db: Session):
        """
        Obtiene todas las participaciones de arrendadores de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[ParticipacionArrendador]: Una lista de todas las participaciones.
        """
        return db.query(ParticipacionArrendador).all()

    @staticmethod
    def obtener_participacion_por_id(db: Session, participacion_id: int):
        """
        Obtiene una participación de arrendador por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            participacion_id (int): El ID de la participación a buscar.

        Returns:
            ParticipacionArrendador: La participación encontrada.

        Raises:
            HTTPException: Si la participación no se encuentra (código 404).
        """
        obj = db.query(ParticipacionArrendador).get(participacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        return obj

    @staticmethod
    def crear_participacion(db: Session, dto: ParticipacionArrendadorDto):
        """
        Crea una nueva participación de arrendador.

        Args:
            db (Session): La sesión de la base de datos.
            dto (ParticipacionArrendadorDto): Los datos de la participación a crear.

        Returns:
            ParticipacionArrendador: La participación recién creada.
        """
        nuevo = ParticipacionArrendador(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        
        return nuevo

    @staticmethod
    def actualizar_participacion(db: Session, participacion_id: int, dto: ParticipacionArrendadorDtoModificacion):
        """
        Actualiza una participación de arrendador existente.

        Args:
            db (Session): La sesión de la base de datos.
            participacion_id (int): El ID de la participación a actualizar.
            dto (ParticipacionArrendadorDtoModificacion): Los datos a modificar.

        Returns:
            ParticipacionArrendador: La participación actualizada.

        Raises:
            HTTPException: Si la participación no se encuentra (código 404).
        """
        obj = db.query(ParticipacionArrendador).get(participacion_id) # Corregido para buscar en el modelo correcto
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj


    @staticmethod
    def eliminar_participacion(db: Session, participacion_id: int):
        """
        Elimina una participación de arrendador.

        Args:
            db (Session): La sesión de la base de datos.
            participacion_id (int): El ID de la participación a eliminar.

        Raises:
            HTTPException: Si la participación no se encuentra (404) o tiene
                           relaciones que impiden su eliminación.
        """
        obj = db.query(ParticipacionArrendador).get(participacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_participaciones_por_id(db, arrendamiento_id):
        """
        Obtiene todas las participaciones asociadas a un arrendamiento.

        Args:
            db (Session): La sesión de la base de datos.
            arrendamiento_id (int): El ID del arrendamiento.

        Returns:
            list[ParticipacionArrendador]: Lista de participaciones del arrendamiento.
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db, arrendamiento_id)
        resultado = arrendamiento.participaciones
        return resultado
