from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.enums.TipoCondicion import TipoCondicion
from backend.services.ArrendadorService import ArrendadorService
from backend.services.FacturacionService import FacturacionService
from ..model.Retencion import Retencion
from backend.dtos.RetencionDto import RetencionDto, RetencionDtoOut, RetencionDtoModificacion

class RetencionService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Retencion).all()

    @staticmethod
    def obtener_por_id(db: Session, retencion_id: int):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, dto: RetencionDto):
        #Esta linea verifica si existe el arrendador
        arrendador = ArrendadorService.obtener_por_id(db, dto.arrendador_id)
        
        if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA:
            raise HTTPException(status_code=400, detail="La condición fiscal del arrendador no le permite realizar retenciones")
        
        #Esta linea verifica si existe la facturacion para la retencion
        FacturacionService.obtener_por_id(db, dto.facturacion_id)
        
        nuevo = Retencion(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, retencion_id: int, dto: RetencionDtoModificacion):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, retencion_id: int):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_retenciones_arrendador(db: Session, arrendador_id: int):
        #Solamente se consulta el arrendador para obtener la excepción en caso de que no exista        
        ArrendadorService.obtener_por_id(db,arrendador_id)
        
        retenciones = db.query(Retencion).filter(
            Retencion.arrendador_id == arrendador_id
        ).all()
        return retenciones