from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from util.database import get_db
from dtos.PrecioDto import PrecioDto, PrecioDtoOut, PrecioDtoModificacion
from services.PrecioService import PrecioService

router = APIRouter()

@router.get("/", response_model=list[PrecioDtoOut], description="Obtención de todos los precios.")
def listar_precios(db: Session = Depends(get_db)):
    return PrecioService.listar_precios(db)

@router.get("/{precio_id}", response_model=PrecioDtoOut, description="Obtención de un precio por id.")
def obtener_precio(precio_id: int, db: Session = Depends(get_db)):
    return PrecioService.obtener_precio_por_id(db, precio_id)

@router.post("/", response_model=PrecioDtoOut, description="Creación de un precio.")
def crear_precio(dto: PrecioDto, db: Session = Depends(get_db)):
    return PrecioService.crear_precio(db, dto)

@router.put("/{precio_id}", response_model=PrecioDtoOut, description="Actualización de un precio por id.")
def actualizar_precio(precio_id: int, dto: PrecioDtoModificacion, db: Session = Depends(get_db)):
    return PrecioService.actualizar_precio(db, precio_id, dto)

@router.delete("/{precio_id}", description="Eliminación de un precio por id.")
def eliminar_precio(precio_id: int, db: Session = Depends(get_db)):
    PrecioService.eliminar_precio(db, precio_id)
    return {"mensaje": "Precio eliminado correctamente."}

@router.post("/consultarBCR", description="Consulta real a la API de la BCR.")
def obtener_precio(db: Session = Depends(get_db)):
    PrecioService.actualizar_precio_bcr(db)
    return  {"mensaje": "LLego sin error, ver base de datos."}

@router.post("/consultarAGD", description="Es el receptor del mensaje diario de AGD para obtener el precio de la soja.")
async def recibir_precio_agd(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    print("Payload recibido:", payload)
    respuesta = PrecioService.actualizar_precio_agd(db, payload)
    return respuesta