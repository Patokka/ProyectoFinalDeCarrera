from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.services.PagoService import PagoService
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
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado")
        return obj

    @staticmethod
    def crear(db: Session, dto: ArrendamientoDto):
        nuevo = Arrendamiento(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        
        # Generar las cuotas después de guardar el arrendamiento
        PagoService.generarCuotas(db, nuevo)
        
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendamiento_id: int, dto: ArrendamientoDtoModificacion):
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, arrendamiento_id: int):
        obj = db.query(Arrendamiento).get(arrendamiento_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendamiento no encontrado")
        db.delete(obj)
        db.commit()