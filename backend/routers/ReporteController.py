from fastapi import Depends, APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.util.database import get_db
from backend.services.ReporteService import ReporteService

router = APIRouter()

@router.get("/reportes/mensual/pdf")
def descargar_reporte(anio: int, mes: int, db: Session = Depends(get_db)):
    buffer = ReporteService.generar_reporte_mensual_pdf(db, anio, mes)
    filename = f"reporte_{anio}_{mes}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )