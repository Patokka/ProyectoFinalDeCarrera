from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.FacturacionDto import FacturacionDto, FacturacionDtoOut, FacturacionDtoModificacion
from ..services.FacturacionService import FacturacionService

router = APIRouter()

@router.get("/", response_model=list[FacturacionDtoOut], description="Obtención de todas las facturación.")
def listar_facturaciones(db: Session = Depends(get_db)):
    return FacturacionService.listar_todos(db)

@router.get("/{facturacion_id}", response_model=FacturacionDtoOut, description="Obtención de una facturación por id.")
def obtener_facturacion(facturacion_id: int, db: Session = Depends(get_db)):
    return FacturacionService.obtener_por_id(db, facturacion_id)

@router.post("/", response_model=FacturacionDtoOut, description="Creación de una facturación.")
def crear_facturacion(dto: FacturacionDto, db: Session = Depends(get_db)):
    return FacturacionService.crear(db, dto)

@router.put("/{facturacion_id}", response_model=FacturacionDtoOut, description="Actualización de una facturación por id.")
def actualizar_facturacion(facturacion_id: int, dto: FacturacionDtoModificacion, db: Session = Depends(get_db)):
    return FacturacionService.actualizar(db, facturacion_id, dto)

@router.delete("/{facturacion_id}", description="Eliminación de una facturación por id.")
def eliminar_facturacion(facturacion_id: int, db: Session = Depends(get_db)):
    FacturacionService.eliminar(db, facturacion_id)
    return {"mensaje": "Facturación eliminada correctamente."}

@router.get("/arrendador/{arrendador_id}", response_model=list[FacturacionDtoOut], description="Obtención de todas las facturaciones de un arrendador.")
def obtener_facturaciones_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    return FacturacionService.obtener_facturaciones_arrendador(db, arrendador_id)
