from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from dtos.UsuarioDto import UsuarioDto, UsuarioDtoOut, UsuarioDtoModificacion, UsuarioLogueado
from util.jwtYPasswordHandler import hash_password, verify_password

class UsuarioService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Usuario).all()

    @staticmethod
    def obtener_por_id(db: Session, Usuario_id: int):
        usuario = db.query(Usuario).get(Usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        return usuario

    @staticmethod
    def crear(db: Session, dto: UsuarioDto):
        usuario_existente = db.query(Usuario).filter(Usuario.cuil == dto.cuil).first()
        if usuario_existente:
            raise HTTPException(status_code=400, detail="El usuario ya existe.")

        usuario = Usuario(
            nombre = dto.nombre,
            apellido = dto.apellido,
            contrasena = hash_password(dto.contrasena),
            mail = dto.mail,
            cuil = dto.cuil,
            rol = dto.rol
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario
    
    @staticmethod
    def actualizar(db: Session, usuario_id: int, dto: UsuarioDtoModificacion):
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(usuario, campo, valor)
        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def eliminar(db: Session, usuario_id: int, current_user: UsuarioLogueado):
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        if usuario.id == current_user.id:
            raise HTTPException(status_code=400, detail="No se puede eliminar a sí mismo.")
        verificar_relaciones_existentes(usuario)
        db.delete(usuario)
        db.commit()
