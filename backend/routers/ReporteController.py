from fastapi import Depends, APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.util.database import get_db
from backend.services.ReporteService import ReporteService

router = APIRouter()

@router.get("/mensual/pdf")
def descargar_reporte(anio: int, mes: int, db: Session = Depends(get_db)):
    buffer = ReporteService.generar_reporte_mensual_pdf(db, anio, mes)
    filename = f"reporte_pagos_{anio}_{mes}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/facturacion/excel")
def descargar_reporte_fiscal(anio_inicio: int, mes_inicio: int, db: Session = Depends(get_db)):
    buffer = ReporteService.generar_reporte_facturacion_anual(db, anio_inicio, mes_inicio)

    filename = f"reporte_facturacion_{anio_inicio}_{mes_inicio:02d}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
    
@router.get("/pagos-pendientes/pdf")
def descargar_reporte_pagos_pendientes(anio: int, mes: int, db: Session = Depends(get_db)):
    """
    Endpoint para descargar el reporte de pagos pendientes en PDF.
    Solo se permiten reportes del mes actual o futuro.
    """
    buffer = ReporteService.generar_reporte_pagos_pendientes_pdf(db, anio, mes)
    filename = f"reporte_pagos_pendientes_{anio}_{mes}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )