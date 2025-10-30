from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Arrendador import Arrendador
from dtos.ArrendadorDto import ArrendadorDto, ArrendadorDtoModificacion

class ArrendadorService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Arrendador).order_by(Arrendador.nombre_o_razon_social).all()

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

        datos = dto.model_dump(exclude_unset=True)

        #Verificación de unicidad de nombre y cuil
        if "nombre_o_razon_social" in datos:
            existe_nombre = (db.query(Arrendador).filter(Arrendador.nombre_o_razon_social == datos["nombre_o_razon_social"],Arrendador.id != arrendador_id).first())
            if existe_nombre:
                raise HTTPException(status_code=400, detail="El nombre ya está registrado para otro arrendador")

        if "cuil" in datos:
            existe_cuil = (db.query(Arrendador).filter(Arrendador.cuil == datos["cuil"], Arrendador.id != arrendador_id).first())
            if existe_cuil:
                raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")

        #Actualización de campos
        for campo, valor in datos.items():
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
