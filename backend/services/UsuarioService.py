from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Usuario import Usuario
from ..dtos.UsuarioDto import UsuarioDto, UsuarioDtoOut, UsuarioDtoModificacion

class UsuarioService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Usuario).all()

    @staticmethod
    def obtener_por_id(db: Session, Usuario_id: int):
        usuario = db.query(Usuario).get(Usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario

    @staticmethod
    def crear(db: Session, dto: UsuarioDto):
        nuevo = Usuario(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, usuario_id: int, dto: UsuarioDtoModificacion):
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(usuario, campo, valor)
        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def eliminar(db: Session, usuario_id: int):
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        db.delete(usuario)
        db.commit()
