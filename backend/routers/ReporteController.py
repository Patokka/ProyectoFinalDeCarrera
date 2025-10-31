from datetime import date
from fastapi import Depends, APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from services.ReporteService import ReporteService

router = APIRouter()

@router.get("/mensual/pdf")
def descargar_reporte(anio: int, mes: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    buffer = ReporteService.generar_reporte_mensual_pdf(db, anio, mes)
    filename = f"reporte_pagos_{mes}-{anio}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/facturacion/excel")
def descargar_reporte_fiscal(anio: int, mes: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    buffer = ReporteService.generar_reporte_facturacion_anual(db, anio, mes)

    filename = f"reporte_facturacion_{mes:02d}-{anio}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pagos-pendientes/pdf")
def descargar_reporte_pagos_pendientes(anio: int, mes: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para descargar el reporte de pagos pendientes en PDF.
    Solo se permiten reportes del mes actual o futuro.
    """
    buffer = ReporteService.generar_reporte_pagos_pendientes_pdf(db, anio, mes)
    filename = f"reporte_pagos_pendientes_{mes}-{anio}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/historial-pagos-arrendador/pdf")
def descargar_reporte_pagos_arrendador(inicio: date, fin: date, arrendador_id:int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para descargar el reporte de pagos de un arrendador en PDF.
    Solo se permiten reportes del mes actual o futuro.
    """
    buffer = ReporteService.generar_reporte_por_arrendador_pdf(db, arrendador_id, inicio, fin)
    filename = f"reporte_pagos_arrendador_{inicio.month}-{inicio.year}_{fin.month}-{fin.year}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )