from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

#Configuración para proteger contraseñas
SECRET_KEY = "claveHasheoEjemplo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Genera un hash seguro para una contraseña.
    Args:
        password (str): La contraseña en texto plano.
    Returns:
        str: El hash de la contraseña.
    """
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica si una contraseña coincide con su hash.
    Args:
        password (str): La contraseña en texto plano a verificar.
        hashed (str): El hash almacenado con el cual comparar.
    Returns:
        bool: True si coinciden, False en caso contrario.
    """
    return pwd_context.verify(password, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Crea un token de acceso JWT.
    Args:
        data (dict): Los datos a incluir en el payload del token.
        expires_delta (timedelta | None, optional): Tiempo de expiración opcional. Si no se provee, por defecto son 15 minutos.
    Returns:
        str: El token JWT codificado.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
