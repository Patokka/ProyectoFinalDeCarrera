
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
from dtos.UsuarioDto import UsuarioLogueado
from enums.TipoRol import TipoRol
from model.Usuario import Usuario
from util.jwtYPasswordHandler import ALGORITHM, SECRET_KEY
from util.database import get_db
from sqlalchemy.orm import Session



#Función para obtener el usuario actual y así proteger las rutas
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> UsuarioLogueado:
    """
    Obtiene el usuario actual autenticado a partir del token JWT.
    Args:
        credentials (HTTPAuthorizationCredentials): Las credenciales extraídas del header de autorización.
        db (Session): Sesión de base de datos.
    Returns:
        UsuarioLogueado: Objeto con la información del usuario logueado.
    Raises:
        HTTPException: Si el token es inválido, ha expirado o el usuario no existe (401).
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id = payload.get("id")
        usuario = db.query(Usuario).get(id)
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido.")

        return UsuarioLogueado.model_validate(payload)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")


#Función para otorgar permisos a determinados roles de usuarios
def admin_required(current_user: UsuarioLogueado = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dependencia para requerir permisos de Administrador.
    Args:
        current_user (UsuarioLogueado): El usuario actual autenticado.
        db (Session): Sesión de base de datos.
    Returns:
        UsuarioLogueado: El usuario si tiene permisos de administrador.
    Raises:
        HTTPException: Si el usuario no tiene rol de Administrador (403).
    """
    usuario = db.query(Usuario).get(current_user.id)
    if usuario.rol != TipoRol.ADMINISTRADOR:
        raise HTTPException(status_code=403, detail="No tienes permisos de Administrador.")
    return current_user

#Función para otorgar permisos a determinados roles de usuarios
def canEditDelete(current_user: UsuarioLogueado = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dependencia para verificar si el usuario tiene permisos de edición/eliminación.
    Los usuarios con rol CONSULTA no tienen estos permisos.
    Args:
        current_user (UsuarioLogueado): El usuario actual autenticado.
        db (Session): Sesión de base de datos.
    Returns:
        UsuarioLogueado: El usuario si tiene permisos.
    Raises:
        HTTPException: Si el usuario tiene rol CONSULTA (403).
    """
    usuario = db.query(Usuario).get(current_user.id)
    if usuario.rol == TipoRol.CONSULTA:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")
    return current_user