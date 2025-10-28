from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Localidad import Localidad
from model.Provincia import Provincia
from dtos.LocalidadDto import LocalidadDto, LocalidadDtoModificacion
from dtos.ProvinciaDto import ProvinciaDto, ProvinciaDtoModificacion

#Esta clase se encargará tanto de las operaciones de las entidades localidad como de provincia.
class UbicacionService:
    ##############################
    #OPERACIONES PARA LOCALIDADES#
    ##############################
    @staticmethod
    def listar_localidades(db: Session):
        return db.query(Localidad).all()

    @staticmethod
    def obtener_localidad_por_id(db: Session, localidad_id: int):
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        return obj

    @staticmethod
    def crear_localidad(db: Session, dto: LocalidadDto):
        nuevo = Localidad(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_localidad(db: Session, localidad_id: int, dto: LocalidadDtoModificacion):
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_localidad(db: Session, localidad_id: int):
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    #############################
    #OPERACIONES PARA PROVINCIAS#
    #############################
    @staticmethod
    def listar_provincias(db: Session):
        return db.query(Provincia).order_by(Provincia.nombre_provincia).all()

    @staticmethod
    def obtener_provincia_por_id(db: Session, provincia_id: int):
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        return obj

    @staticmethod
    def crear_provincia(db: Session, dto: ProvinciaDto):
        nuevo = Provincia(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_provincia(db: Session, provincia_id: int, dto: ProvinciaDtoModificacion):
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_provincia(db: Session, provincia_id: int):
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_localidades_provincia(db:Session, provincia_id: int):
        localidades = db.query(Localidad).filter(Localidad.provincia_id == provincia_id).order_by(Localidad.nombre_localidad).all()
        return localidades