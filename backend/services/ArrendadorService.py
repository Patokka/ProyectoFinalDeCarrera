from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Arrendador import Arrendador
from dtos.ArrendadorDto import ArrendadorDto, ArrendadorDtoOut, ArrendadorDtoModificacion

class ArrendadorService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Arrendador).all()

    @staticmethod
    def obtener_por_id(db: Session, arrendador_id: int):
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")
        return arrendador

    @staticmethod
    def crear(db: Session, dto: ArrendadorDto):
        # Validar si ya existe CUIL
        existente = db.query(Arrendador).filter(Arrendador.cuil == dto.cuil).first()
        if existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")
        nuevo = Arrendador(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendador_id: int, dto: ArrendadorDtoModificacion):
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(arrendador, campo, valor)
        db.commit()
        db.refresh(arrendador)
        return arrendador

    @staticmethod
    def eliminar(db: Session, arrendador_id: int):
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")
        
        verificar_relaciones_existentes(arrendador)
        
        db.delete(arrendador)
        db.commit()
