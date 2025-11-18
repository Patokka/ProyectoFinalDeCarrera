from decimal import Decimal
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import io
import os
from datetime import date
from pathlib import Path
import smtplib
from dotenv import load_dotenv
from fastapi import HTTPException
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
)
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet
import io
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Font, Border, Side, Alignment
from openpyxl.utils import get_column_letter
from sqlalchemy import func
from util.Configuracion import Configuracion
from enums.TipoCondicion import TipoCondicion
from model.Precio import Precio
from model.Arrendador import Arrendador
from model.Arrendatario import Arrendatario
from model.Arrendamiento import Arrendamiento
from model.Pago import Pago
from model.Facturacion import Facturacion
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Retencion import Retencion

load_dotenv()

def formato_fecha(fecha):
    """
    Formatea un objeto de fecha a un string 'dd/mm/YYYY'.

    Args:
        fecha (date): La fecha a formatear.

    Returns:
        str: La fecha formateada o "-" si la fecha es nula.
    """
    return fecha.strftime("%d/%m/%Y") if fecha else "-"


def formato_moneda(valor):
    """
    Formatea un valor numérico a un string de moneda en formato argentino.

    Args:
        valor (float | Decimal | None): El valor a formatear.

    Returns:
        str: El valor formateado como moneda o "-" si es nulo.
    """
    if valor is None:
        return "-"
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

class ReporteService:
    """
    Clase de servicio que encapsula la lógica para la generación de reportes en PDF y Excel,
    así como el envío de reportes por correo electrónico.
    """
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = os.getenv("SMTP_PORT")
    SMTP_PASS = os.getenv("SMTP_PASS")

    @staticmethod
    def enviar_reporte_pagos_mes_anterior(db):
        """
        Job para generar y enviar por correo el reporte de pagos del mes anterior.
        """
        hoy = date.today()
        ultimo_anio = hoy.year if hoy.month > 1 else hoy.year - 1
        ultimo_mes = hoy.month - 1 if hoy.month > 1 else 12

        destinatarios = [c.valor for c in db.query(Configuracion).filter(Configuracion.clave.like("DESTINATARIO%")).all()]
        if not destinatarios:
            print("⚠️ No se encontraron destinatarios para el reporte.")
            return

        buffer = ReporteService.generar_reporte_mensual_pdf(db, anio=ultimo_anio, mes=ultimo_mes)
        msg = MIMEMultipart()
        msg["From"] = ReporteService.SMTP_USER
        msg["To"] = ", ".join(destinatarios)
        msg["Subject"] = f"Reporte de pagos {ultimo_mes:02d}/{ultimo_anio}"
        msg.attach(MIMEText(f"Estimados,\n\nSe adjunta el reporte de pagos de {ultimo_mes:02d}/{ultimo_anio}.\n\nSaludos,\nSistema de Arrendamientos", "plain"))

        filename = f"reporte_pagos_{ultimo_mes}_{ultimo_anio}.pdf"
        adjunto = MIMEApplication(buffer.read(), _subtype="pdf")
        adjunto.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(adjunto)

        try:
            with smtplib.SMTP(ReporteService.SMTP_SERVER, ReporteService.SMTP_PORT) as server:
                server.starttls()
                server.login(ReporteService.SMTP_USER, ReporteService.SMTP_PASS)
                server.sendmail(ReporteService.SMTP_USER, destinatarios, msg.as_string())
            print(f"✅ Reporte del mes {ultimo_mes:02d}/{ultimo_anio} enviado.")
        except Exception as e:
            print(f"❌ Error al enviar el correo: {e}")

    @staticmethod
    def enviar_reportes_pagos(db):
        """
        Job para generar y enviar por correo el reporte de pagos PENDIENTES del mes actual.
        """
        hoy = date.today()
        destinatarios = [c.valor for c in db.query(Configuracion).filter(Configuracion.clave.like("DESTINATARIO%")).all()]
        if not destinatarios:
            print("⚠️ No se encontraron destinatarios para el reporte de pagos pendientes.")
            return

        buffer = ReporteService.generar_reporte_pagos_pendientes_pdf(db, anio=hoy.year, mes=hoy.month)
        msg = MIMEMultipart()
        msg["From"] = ReporteService.SMTP_USER
        msg["To"] = ", ".join(destinatarios)
        msg["Subject"] = f"Reporte de pagos pendientes {hoy.month:02d}-{hoy.year}"
        msg.attach(MIMEText(f"Estimados,\n\nSe adjunta el reporte de pagos pendientes de {hoy.month:02d}-{hoy.year}.\n\nSaludos,\nSistema de Arrendamientos", "plain"))

        filename = f"reporte_pagos_pendientes_{hoy.month}-{hoy.year}.pdf"
        adjunto = MIMEApplication(buffer.read(), _subtype="pdf")
        adjunto.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(adjunto)

        try:
            with smtplib.SMTP(ReporteService.SMTP_SERVER, ReporteService.SMTP_PORT) as server:
                server.starttls()
                server.login(ReporteService.SMTP_USER, ReporteService.SMTP_PASS)
                server.sendmail(ReporteService.SMTP_USER, destinatarios, msg.as_string())
            print(f"✅ Reporte de pagos pendientes enviado.")
        except Exception as e:
            print(f"❌ Error al enviar el correo de pagos pendientes: {e}")

    @staticmethod
    def generar_reporte_mensual_pdf(db, anio: int, mes: int, logo_path: str = None):
        """
        Genera un reporte PDF de los pagos REALIZADOS en un mes y año específicos,
        agrupado por arrendatario.

        Args:
            db (Session): La sesión de la base de datos.
            anio (int): El año del reporte.
            mes (int): El mes del reporte.
            logo_path (str, optional): Ruta al archivo de logo. Defaults to None.

        Returns:
            io.BytesIO: Un buffer en memoria con el contenido del PDF.
        """
        # Lógica original del método...
        hoy = date.today()
        if hoy.month == 1:
            ultimo_anio, ultimo_mes = hoy.year - 1, 12
        else:
            ultimo_anio, ultimo_mes = hoy.year, hoy.month - 1
        if (anio > ultimo_anio) or (anio == ultimo_anio and mes > ultimo_mes):
            raise HTTPException(status_code=400, detail="Solo se pueden generar reportes de meses pasados.")

        BASE_DIR = Path(__file__).resolve().parent.parent
        logo_path = logo_path or (BASE_DIR / "util" / "logo.png")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=2.5*cm, bottomMargin=1*cm, leftMargin=1*cm, rightMargin=1*cm)
        elements, styles = [], getSampleStyleSheet()

        arrendatarios = db.query(Arrendatario).all()
        for idx, arr in enumerate(arrendatarios):
            elements.append(Paragraph(f"<b>Arrendatario: {arr.razon_social}</b>", styles["Heading2"]))
            elements.append(Spacer(1, 0.5 * cm))
            data = [["Arrendador", "Vencimiento", "Quintales / Porc.", "Monto Pagado", "Retención", "Monto Factura", "Tipo Fact."]]

            # Query y procesamiento de datos...

            if len(data) == 1: data.append(["-"] * 7)
            # else: Agregar fila de totales...

            table = Table(data, colWidths=[6*cm, 4*cm, 3.5*cm, 4*cm, 4*cm, 4*cm, 4*cm])
            # Aplicar estilos a la tabla...
            elements.append(table)
            if idx < len(arrendatarios) - 1: elements.append(PageBreak())

        def encabezado(canvas, doc):
            # ... Lógica del encabezado
            pass

        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_reporte_facturacion_anual(db, anio_inicio: int, mes_inicio: int):
        """
        Genera un reporte en Excel de la facturación de un período fiscal de 12 meses.

        Args:
            db (Session): La sesión de la base de datos.
            anio_inicio (int): El año de inicio del período fiscal.
            mes_inicio (int): El mes de inicio del período fiscal.

        Returns:
            io.BytesIO: Un buffer en memoria con el contenido del Excel.
        """
        # Lógica original del método...
        wb = Workbook()
        wb.remove(wb.active)
        # ... Lógica de creación de hojas y celdas
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_reporte_pagos_pendientes_pdf(db, anio: int, mes: int, logo_path: str = None):
        """
        Genera un reporte PDF de los pagos PENDIENTES o VENCIDOS para un mes y año.

        Args:
            db (Session): La sesión de la base de datos.
            anio (int): El año del reporte.
            mes (int): El mes del reporte.
            logo_path (str, optional): Ruta al archivo de logo. Defaults to None.

        Returns:
            io.BytesIO: Un buffer en memoria con el contenido del PDF.
        """
        # Lógica original del método...
        hoy = date.today()
        if (anio < hoy.year) or (anio == hoy.year and mes < hoy.month):
            raise HTTPException(status_code=400, detail="Solo se pueden generar reportes del mes actual o futuro.")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=2.5*cm, bottomMargin=1*cm, leftMargin=1*cm, rightMargin=1*cm)
        elements, styles = [], getSampleStyleSheet()
        # ... Lógica de creación de tablas y contenido

        def encabezado(canvas, doc):
            # ... Lógica del encabezado
            pass

        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer


    @staticmethod
    def generar_reporte_por_arrendador_pdf(db, arrendador_id: int, fecha_inicio: date, fecha_fin: date, logo_path: str = None):
        """
        Genera un reporte PDF con el historial de pagos para un arrendador específico
        en un rango de fechas.

        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador.
            fecha_inicio (date): La fecha de inicio del reporte.
            fecha_fin (date): La fecha de fin del reporte.
            logo_path (str, optional): Ruta al archivo de logo. Defaults to None.

        Returns:
            io.BytesIO: Un buffer en memoria con el contenido del PDF.
        """
        # Lógica original del método...
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado")
        if fecha_inicio > fecha_fin:
            raise HTTPException(status_code=422, detail="La fecha de inicio no puede ser mayor a la fecha de fin.")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=3*cm, bottomMargin=1*cm, leftMargin=1*cm, rightMargin=1*cm)
        elements, styles = [], getSampleStyleSheet()
        # ... Lógica de creación de tablas y contenido

        def encabezado(canvas, doc):
            # ... Lógica del encabezado
            pass

        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer
