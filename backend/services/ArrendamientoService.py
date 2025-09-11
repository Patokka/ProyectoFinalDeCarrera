from datetime import date, timedelta
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

    @staticmethod
    def listar_todos(db: Session):
        arrendamientos = (
            db.query(Arrendamiento)
            .options(
                joinedload(Arrendamiento.participaciones)
                .joinedload(ParticipacionArrendador.arrendador)
            )
            .all()
        )

        result = []
        for arr in arrendamientos:
            arr_dto = ArrendamientoDtoOut.model_validate(arr)
            # mapear solo arrendadores, no participaciones
            arr_dto.arrendadores = [p.arrendador for p in arr.participaciones]
            result.append(arr_dto)

        return result

    @staticmethod
    def obtener_por_id(db: Session, arrendamiento_id: int):
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado.")
        return obj

    @staticmethod
    def crear(db: Session, dto: ArrendamientoDto):
        nuevo = Arrendamiento(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendamiento_id: int, dto: ArrendamientoDtoModificacion):
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
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado.")
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def cancelar_arrendamiento(db: Session, arrendamiento_id: int):
        #Verificar si existe el arrendamiento
        arrendamiento = ArrendamientoService.obtener_por_id(db, arrendamiento_id)
        
        pagos = db.query(Pago).filter(Pago.arrendamiento_id == arrendamiento_id).all()
        
        for pago in pagos:
            pago.estado = EstadoPago.CANCELADO
        
        arrendamiento.estado = EstadoArrendamiento.CANCELADO
        
        db.commit()        
        return arrendamiento
    
    @staticmethod
    def finalizar_arrendamiento(db: Session, arrendamiento_id: int):
        arrendamiento = ArrendamientoService.obtener_por_id(db,arrendamiento_id)
        
        if arrendamiento.estado == EstadoArrendamiento.CANCELADO:
            raise HTTPException(status_code=500, detail=f"No se puede finalizar el arrendamiento de id {arrendamiento.id} ya que el mismo ha sido CANCELADO.")
        
        if ArrendamientoService.tieneCuotasPagadas(db, arrendamiento.id):
            arrendamiento.estado = EstadoArrendamiento.FINALIZADO
            db.commit()
            return arrendamiento
        else:
            raise HTTPException(status_code=500, detail= f"No se puede finalizar el arrendamiento de id {arrendamiento.id} ya que posee cuotas sin facturar.")
    
    @staticmethod
    def tieneCuotasPagadas(db: Session, arrendamiento_id):
        """
        Devuelve True si el arrendamiento tiene TODAS sus cuotas pagadas (estado REALIZADO).
        Si existe al menos un pago en otro estado entonces devuelve False.
        """

        # Consultamos si existe algún pago que NO esté realizado
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
        Marca como FINALIZADO todos los arrendamientos con vencimiento en el día de ayer
        que aún estén en estado PENDIENTE.
        """
        hoy = date.today()
        ayer = hoy - timedelta(days=1)

        # Buscar arrendamientos pendientes con vencimiento ayer
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
        return db.query(ParticipacionArrendador).all()

    @staticmethod
    def obtener_participacion_por_id(db: Session, participacion_id: int):
        obj = db.query(ParticipacionArrendador).get(participacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        return obj

    @staticmethod
    def crear_participacion(db: Session, dto: ParticipacionArrendadorDto):
        nuevo = ParticipacionArrendador(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        
        return nuevo

    @staticmethod
    def actualizar_participacion(db: Session, participacion_id: int, dto: ParticipacionArrendadorDtoModificacion):
        obj = db.query(ParticipacionArrendadorDto).get(participacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_participacion(db: Session, participacion_id: int):
        obj = db.query(ParticipacionArrendador).get(participacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Participación no encontrada.")
        db.delete(obj)
        db.commit()