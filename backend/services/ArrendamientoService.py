from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDto, ParticipacionArrendadorDtoModificacion
from backend.model.ParticipacionArrendador import ParticipacionArrendador
from ..model.Arrendamiento import Arrendamiento
from ..dtos.ArrendamientoDto import ArrendamientoDto, ArrendamientoDtoOut, ArrendamientoDtoModificacion

class ArrendamientoService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Arrendamiento).all()

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