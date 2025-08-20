
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from backend.enums.TipoRol import TipoRol
from backend.model.Usuario import Usuario
from backend.util.jwtYPasswordHandler import ALGORITHM, SECRET_KEY


#Función para obtener el usuario actual y así proteger las rutas
security = HTTPBearer()
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        print(username)
        return {"username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

#Función para otorgar permisos a determinados roles de usuarios
def admin_required(current_user: Usuario = Depends(get_current_user)):
    print(current_user)
    if current_user.rol == TipoRol.CONSULTA:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador u operador.")
    return current_user