from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete, get_current_user
from util.database import get_db
from dtos.PrecioDto import PrecioDto, PrecioDtoOut, PrecioDtoModificacion
from services.PrecioService import PrecioService

router = APIRouter()

@router.get("", response_model=list[PrecioDtoOut], description="Obtención de todos los precios.", dependencies=[Depends(get_current_user)])
def listar_precios(db: Session = Depends(get_db)):
    return PrecioService.listar_precios(db)

@router.get("/AGD", response_model=list[PrecioDtoOut], description="Obtención de todos los precios de AGD.", dependencies=[Depends(get_current_user)])
def listar_preciosAGD(db: Session = Depends(get_db)):
    return PrecioService.listar_precios_agd(db)

@router.get("/BCR", response_model=list[PrecioDtoOut], description="Obtención de todos los precios de BCR.", dependencies=[Depends(get_current_user)])
def listar_preciosBCR(db: Session = Depends(get_db)):
    return PrecioService.listar_precios_bcr(db)

@router.get("/pago/{pago_id}", response_model=list[PrecioDtoOut])
def get_precios_pago(pago_id: int, db: Session = Depends(get_db)):
    return PrecioService.obtener_precios_pago(db, pago_id)

@router.get("/{precio_id}", response_model=PrecioDtoOut, description="Obtención de un precio por id.", dependencies=[Depends(get_current_user)])
def obtener_precio(precio_id: int, db: Session = Depends(get_db)):
    return PrecioService.obtener_precio_por_id(db, precio_id)

@router.post("", response_model=PrecioDtoOut, description="Creación de un precio.")
def crear_precio(dto: PrecioDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    return PrecioService.crear_precio(db, dto)

@router.put("/{precio_id}", response_model=PrecioDtoOut, description="Actualización de un precio por id.", dependencies=[Depends(get_current_user)])
def actualizar_precio(precio_id: int, dto: PrecioDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    return PrecioService.actualizar_precio(db, precio_id, dto)

@router.delete("/{precio_id}", description="Eliminación de un precio por id.", dependencies=[Depends(get_current_user)])
def eliminar_precio(precio_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    PrecioService.eliminar_precio(db, precio_id)
    return {"mensaje": "Precio eliminado correctamente."}

@router.post("/consultarBCR", description="Consulta real a la API de la BCR.", dependencies=[Depends(get_current_user)])
def obtener_precio(db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    PrecioService.actualizar_precio_bcr(db)
    return  {"mensaje": "LLego sin error, ver base de datos."}

@router.post("/consultarAGD", description="Es el receptor del mensaje diario de AGD para obtener el precio de la soja.")
async def recibir_precio_agd(request: Request, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    payload = await request.json()
    print("Payload recibido:", payload)
    respuesta = PrecioService.actualizar_precio_agd(db, payload)
    return respuesta