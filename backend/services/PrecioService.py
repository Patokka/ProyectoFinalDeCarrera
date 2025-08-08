from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Precio import Precio
from ..model.ConsultaPrecio import ConsultaPrecio
from backend.dtos.PrecioDto import PrecioDto, PrecioDtoModificacion
from backend.dtos.ConsultaPrecioDto import ConsultaPrecioDto, ConsultaPrecioDtoModificacion

#Esta clase se encargará tanto de las operaciones de las entidades localidad como de provincia.
class PrecioService:
    ##############################
    ###OPERACIONES PARA PRECIOS###
    ##############################
    @staticmethod
    def listar_precios(db: Session):
        return db.query(Precio).all()

    @staticmethod
    def obtener_precio_por_id(db: Session, precio_id: int):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        return obj

    @staticmethod
    def crear_precio(db: Session, dto: PrecioDto):
        nuevo = Precio(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_precio(db: Session, precio_id: int, dto: PrecioDtoModificacion):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_precio(db: Session, precio_id: int):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        db.delete(obj)
        db.commit()
        
    #######################################
    #OPERACIONES PARA CONSULTAS DE PRECIOS#
    #######################################
    @staticmethod
    def listar_consultas(db: Session):
        return db.query(ConsultaPrecio).all()

    @staticmethod
    def obtener_consulta(db: Session, consulta_precio_id: int):
        obj = db.query(ConsultaPrecio).get(consulta_precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        return obj

    @staticmethod
    def crear_consulta(db: Session, dto: ConsultaPrecioDto):
        nuevo = ConsultaPrecio(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_consulta(db: Session, consulta_precio_id: int, dto: ConsultaPrecioDtoModificacion):
        obj = db.query(ConsultaPrecio).get(consulta_precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_consulta(db: Session, consulta_precio_id: int):
        obj = db.query(ConsultaPrecio).get(consulta_precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        db.delete(obj)
        db.commit()