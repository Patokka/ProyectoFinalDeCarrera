from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from dtos.UsuarioDto import UsuarioDto, UsuarioLogueado
from util.jwtYPasswordHandler import hash_password, verify_password

class UsuarioService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de usuarios.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todos los usuarios de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Usuario]: Una lista de todos los usuarios.
        """
        return db.query(Usuario).all()

    @staticmethod
    def obtener_por_id(db: Session, Usuario_id: int):
        """
        Obtiene un usuario por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            Usuario_id (int): El ID del usuario a buscar.

        Returns:
            Usuario: El usuario encontrado.

        Raises:
            HTTPException: Si el usuario no se encuentra (código 404).
        """
        usuario = db.query(Usuario).get(Usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        return usuario

    @staticmethod
    def crear(db: Session, dto: UsuarioDto):
        """
        Crea un nuevo usuario en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (UsuarioDto): Los datos del usuario a crear.

        Returns:
            Usuario: El usuario recién creado.

        Raises:
            HTTPException: Si el CUIL ya está registrado (código 400).
        """
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
        """
        Actualiza los datos de un usuario existente.

        Args:
            db (Session): La sesión de la base de datos.
            usuario_id (int): El ID del usuario a actualizar.
            dto (UsuarioDto): Los datos a modificar.

        Returns:
            Usuario: El usuario actualizado.

        Raises:
            HTTPException: Si el usuario no se encuentra (404) o si el CUIL ya está
                           en uso por otro usuario (400).
        """
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
        usuario_existente = db.query(Usuario).filter(Usuario.cuil == dto.cuil, Usuario.id != usuario_id).first()
        if usuario_existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro usuario.")
        
        campos = dto.model_dump(exclude_unset=True)
        if "contrasena" in campos and campos["contrasena"]:
            campos["contrasena"] = hash_password(campos["contrasena"])

        for campo, valor in campos.items():
            setattr(usuario, campo, valor)
        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def eliminar(db: Session, usuario_id: int, current_user: UsuarioLogueado):
        """
        Elimina un usuario de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            usuario_id (int): El ID del usuario a eliminar.
            current_user (UsuarioLogueado): El usuario autenticado que realiza la operación.

        Raises:
            HTTPException: Si el usuario no se encuentra (404), si el usuario intenta
                           eliminarse a sí mismo (400), o si tiene relaciones que impiden
                           su eliminación.
        """
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
        """
        Cambia la contraseña de un usuario.

        Args:
            db (Session): La sesión de la base de datos.
            usuario_id (int): El ID del usuario.
            contrasena_actual (str): La contraseña actual para verificación.
            contrasena_nueva (str): La nueva contraseña.

        Returns:
            Usuario: El usuario con la contraseña actualizada.

        Raises:
            ValueError: Si el usuario no se encuentra, la contraseña actual es incorrecta
                        o la nueva contraseña es igual a la actual.
        """
        usuario = db.query(Usuario).get(usuario_id)
        if not usuario:
            raise ValueError("Usuario no encontrado")

        if not verify_password(contrasena_actual, usuario.contrasena):
            raise ValueError("La contraseña actual es incorrecta")

        if verify_password(contrasena_nueva, usuario.contrasena):
            raise ValueError("La nueva contraseña no puede ser igual a la actual")

        usuario.contrasena = hash_password(contrasena_nueva)
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario
