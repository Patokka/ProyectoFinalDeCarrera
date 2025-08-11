from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Precio import Precio
from backend.dtos.PrecioDto import PrecioDto, PrecioDtoModificacion

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
        
        
    @staticmethod
    def obtener_precio_bcr():
        url = "https://api.bcr.com/precio-diario"  # Cambiar por URL real
        headers = {"Authorization": "Bearer TU_TOKEN_BCR"}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return data["valor"]  # Ajustar según respuesta real
        return None

    @staticmethod
    def obtener_precio_agd():
        url = "https://api.agd.com/precio-diario"  # Cambiar por URL real
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return data["valor"]  # Ajustar según respuesta real
        return None
        