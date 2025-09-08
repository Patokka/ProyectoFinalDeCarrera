
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
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        cuil = payload.get("cuil")
        if cuil is None:
            raise HTTPException(status_code=401, detail="Token inválido.")

        return UsuarioLogueado.model_validate(payload)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")


#Función para otorgar permisos a determinados roles de usuarios
def admin_required(current_user: UsuarioLogueado = Depends(get_current_user)):
    print(current_user)
    if current_user.rol == TipoRol.CONSULTA.name:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador u operador.")
    return current_user