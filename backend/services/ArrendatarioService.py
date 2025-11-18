from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Arrendatario import Arrendatario
from dtos.ArrendatarioDto import ArrendatarioDto, ArrendatarioDtoModificacion

class ArrendatarioService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Arrendatario).all()

    @staticmethod
    def obtener_por_id(db: Session, arrendatario_id: int):
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        return obj

    @staticmethod
    def crear(db: Session, dto: ArrendatarioDto):
        # Validar si ya existe CUIL
        existente = db.query(Arrendatario).filter(Arrendatario.cuit == dto.cuit).first()
        if existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendatario")
        nuevo = Arrendatario(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendatario_id: int, dto: ArrendatarioDtoModificacion):
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        
        datos = dto.model_dump(exclude_unset=True)
        
        #Verificación de unicidad de nombre y cuit
        if "razon_social" in datos:
            existe_nombre = (db.query(Arrendatario).filter(Arrendatario.razon_social == datos["razon_social"],Arrendatario.id != arrendatario_id).first())
            if existe_nombre:
                raise HTTPException(status_code=400, detail="El nombre ya está registrado para otro arrendatario")

        if "cuit" in datos:
            existe_cuit = (db.query(Arrendatario).filter(Arrendatario.cuit == datos["cuit"], Arrendatario.id != arrendatario_id).first())
            if existe_cuit:
                raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")

        #Actualización de campos
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, arrendatario_id: int):
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()