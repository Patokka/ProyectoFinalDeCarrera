from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from dtos.UsuarioDto import UsuarioDto, UsuarioLogueado
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
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro usuario.")

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
    def actualizar(db: Session, usuario_id: int, dto: UsuarioDto):
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
        usuario_existente = db.query(Usuario).filter(Usuario.cuil == dto.cuil, Usuario.id != usuario_id).first()
        if usuario_existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro usuario.")
        
        # Convertir los datos del DTO en diccionario
        campos = dto.model_dump(exclude_unset=True)

        # Si viene una contraseña nueva, la hasheamos
        if "contrasena" in campos and campos["contrasena"]:
            campos["contrasena"] = hash_password(campos["contrasena"])

        # Actualizamos los campos del usuario
        for campo, valor in campos.items():
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

    @staticmethod
    def cambiar_contrasena(db: Session, usuario_id: int, contrasena_actual: str, contrasena_nueva: str):
        # Obtener usuario
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise ValueError("Usuario no encontrado")

        # Validar contraseña actual
        if not verify_password(contrasena_actual, usuario.contrasena):
            raise ValueError("La contraseña actual es incorrecta")

        # Validar que la nueva contraseña sea distinta a la actual
        if verify_password(contrasena_nueva, usuario.contrasena):
            raise ValueError("La nueva contraseña no puede ser igual a la actual")

        # Guardar nueva contraseña
        usuario.contrasena = hash_password(contrasena_nueva)

        # Commit en la DB
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        return usuario
