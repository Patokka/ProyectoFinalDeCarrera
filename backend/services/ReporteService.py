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
from util import Configuracion
from enums.TipoCondicion import TipoCondicion
from model.Precio import Precio
from model.Arrendador import Arrendador
from model.Arrendatario import Arrendatario
from model.Arrendamiento import Arrendamiento
from model.Pago import Pago
from model.Facturacion import Facturacion
from model.ParticipacionArrendador import ParticipacionArrendador
from model.Retencion import Retencion

# Cargar variables del .env
load_dotenv()

def formato_fecha(fecha):
    return fecha.strftime("%d/%m/%Y") if fecha else "-"


def formato_moneda(valor):
    if valor is None:
        return "-"
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

class ReporteService:  
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = os.getenv("SMTP_PORT")
    SMTP_PASS = os.getenv("SMTP_PASS")

    @staticmethod
    def enviar_reporte_pagos_mes_anterior(db):
        hoy = date.today()
        #Calcular mes anterior
        if hoy.month == 1:
            ultimo_anio = hoy.year - 1
            ultimo_mes = 12
        else:
            ultimo_anio = hoy.year
            ultimo_mes = hoy.month - 1
        #Obtener destinatarios desde configuración (DESTINATARIO_*)
        destinatarios = [
            c.valor for c in db.query(Configuracion)
            .filter(Configuracion.clave.like("DESTINATARIO%"))
            .order_by(Configuracion.clave.asc())
            .all()
        ]
        if not destinatarios:
            print("⚠️ No se encontraron destinatarios configurados en la tabla 'configuracion'.")
            return
        #Generar el reporte del mes anterior
        buffer = ReporteService.generar_reporte_mensual_pdf(db, anio=ultimo_anio, mes=ultimo_mes)
        #Preparar email
        msg = MIMEMultipart()
        msg["From"] = ReporteService.SMTP_USER
        msg["To"] = ", ".join(destinatarios)
        msg["Subject"] = f"Reporte de pagos pendientes {ultimo_mes:02d}/{ultimo_anio}"
        cuerpo = f"""
        Estimados/as,

        Se adjunta el reporte de pagos correspondientes a {ultimo_mes:02d}/{ultimo_anio}.

        Saludos,
        Sistema de Arrendamientos
        """
        msg.attach(MIMEText(cuerpo, "plain"))
        #Adjuntar PDF
        filename = f"reporte_pagos_pendientes_{ultimo_mes}_{ultimo_anio}.pdf"
        adjunto = MIMEApplication(buffer.read(), _subtype="pdf")
        adjunto.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(adjunto)
        #Enviar correo
        try:
            with smtplib.SMTP(ReporteService.SMTP_SERVER, ReporteService.SMTP_PORT) as server:
                server.starttls()
                server.login(ReporteService.SMTP_USER, ReporteService.SMTP_PASS)
                server.sendmail(ReporteService.SMTP_USER, destinatarios, msg.as_string())
            print(f"✅ Reporte del mes {ultimo_mes:02d}/{ultimo_anio} enviado a {len(destinatarios)} destinatarios.")
        except Exception as e:
            print(f"❌ Error al enviar el correo: {e}")

    @staticmethod
    def enviar_reportes_pagos(db):
        hoy = date.today()
        #Obtener destinatarios desde configuración (DESTINATARIO_*)
        destinatarios = [
            c.valor for c in db.query(Configuracion)
            .filter(Configuracion.clave.like("DESTINATARIO%"))
            .order_by(Configuracion.clave.asc())
            .all()
        ]
        if not destinatarios:
            print("⚠️ No se encontraron destinatarios configurados en la tabla 'configuracion'.")
            return
        #Generar el reporte del mes actual
        buffer = ReporteService.generar_reporte_pagos_pendientes_pdf(
            db, anio=hoy.year, mes=hoy.month
        )
        #Preparar el correo
        msg = MIMEMultipart()
        msg["From"] = ReporteService.SMTP_USER
        msg["To"] = ", ".join(destinatarios)
        msg["Subject"] = f"Reporte de pagos pendientes {hoy.month:02d}-{hoy.year}"
        cuerpo = f"""
        Estimados/as,

        Se adjunta el reporte de pagos pendientes correspondiente a {hoy.month:02d}-{hoy.year}.

        Saludos,
        Sistema de Arrendamientos
        """
        msg.attach(MIMEText(cuerpo, "plain"))
        #Adjuntar PDF
        filename = f"reporte_pagos_pendientes_{hoy.month}-{hoy.year}.pdf"
        adjunto = MIMEApplication(buffer.read(), _subtype="pdf")
        adjunto.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(adjunto)
        #Enviar correo
        try:
            with smtplib.SMTP(ReporteService.SMTP_SERVER, ReporteService.SMTP_PORT) as server:
                server.starttls()
                server.login(ReporteService.SMTP_USER, ReporteService.SMTP_PASS)
                server.sendmail(ReporteService.SMTP_USER, destinatarios, msg.as_string())
            print(f"✅ Reporte de pagos enviados a {len(destinatarios)} destinatarios.")
        except Exception as e:
            print(f"❌ Error al enviar el correo: {e}")

    @staticmethod
    def generar_reporte_mensual_pdf(db, anio: int, mes: int, logo_path: str = None):
        """
        Genera un reporte mensual, agrupado por arrendatario.
        Incluye columna totales por arrendatario,
        título centrado, logo y márgenes visibles.
        """
        hoy = date.today()
        if hoy.month == 1:
            ultimo_anio = hoy.year - 1
            ultimo_mes = 12
        else:
            ultimo_anio = hoy.year
            ultimo_mes = hoy.month - 1
        if (anio > ultimo_anio) or (anio == ultimo_anio and mes > ultimo_mes):
            raise HTTPException(
                status_code=400,
                detail=f"Solo se pueden generar reportes hasta {ultimo_mes:02d}-{ultimo_anio}. "
                    f"El mes actual ({hoy.month:02d}-{hoy.year}) y meses futuros no están permitidos."
            )
        BASE_DIR = Path(__file__).resolve().parent.parent
        logo_path = BASE_DIR / "util" / "logo.png"
        fecha_inicio = date(anio, mes, 1)
        fecha_fin = date(anio + (mes // 12), (mes % 12) + 1, 1)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1 * cm,
            leftMargin=1 * cm,
            topMargin=2.5 * cm,
            bottomMargin=1 * cm,
        )
        elements = []
        styles = getSampleStyleSheet()
        arrendatarios = db.query(Arrendatario).all()
        for idx, arr in enumerate(arrendatarios):
            titulo = Paragraph(f"<b>Arrendatario: {arr.razon_social}</b>", styles["Heading2"])
            elements.append(titulo)
            elements.append(Spacer(1, 0.5 * cm))
            data = [["Arrendador", "Vencimiento", "Quintales / Porcentaje", "Monto a Pagar Arrendador", "Retención", "Monto Factura", "Tipo Factura"]]
            total_pagos = 0
            total_retenciones = 0
            total_facturas = 0
            total_quintales = 0
            # Join completo para evitar duplicados
            resultados = (
                db.query(Pago, ParticipacionArrendador, Arrendador, Facturacion, Retencion)
                .join(ParticipacionArrendador, Pago.participacion_arrendador_id == ParticipacionArrendador.id)
                .join(Arrendador, Arrendador.id == ParticipacionArrendador.arrendador_id)
                .outerjoin(Facturacion, Facturacion.pago_id == Pago.id)
                .outerjoin(Retencion, Retencion.facturacion_id == Facturacion.id)
                .filter(Pago.arrendamiento.has(arrendatario_id=arr.id))
                .filter(Pago.vencimiento >= fecha_inicio, Pago.vencimiento < fecha_fin, Pago.estado == "REALIZADO")
                .all()
            )
            processed_rows = set()  # (pago_id, arrendador_id, facturacion_id, retencion_id)
            for pago, participacion, arrendador, fac, ret in resultados:
                pago_id = getattr(pago, "id", id(pago))
                arr_id = getattr(arrendador, "id", id(arrendador))
                fac_id = getattr(fac, "id", None)
                ret_id = getattr(ret, "id", None)
                row_key = (pago_id, arr_id, fac_id, ret_id)
                if row_key in processed_rows:
                    continue
                processed_rows.add(row_key)
                # Quintales / Porcentaje
                if getattr(pago, "quintales", None) is not None:
                    quintales_val = float(pago.quintales)
                    valor_quintales_row = f"{quintales_val:.2f} qq"
                    try:
                        total_quintales += float(pago.quintales)
                    except Exception:
                        pass
                elif getattr(pago, "porcentaje", None) is not None:
                    valor_quintales_row = f"{pago.porcentaje}%"
                else:
                    valor_quintales_row = "-"
                nombre_arrendador = arrendador.nombre_o_razon_social if arrendador else "-"
                monto_pago = pago.monto_a_pagar or 0
                total_pagos += monto_pago
                monto_factura = fac.monto_facturacion if fac else "-"
                if fac:
                    total_facturas += fac.monto_facturacion or 0
                retencion_valor = ret.total_retencion if ret else "-"
                if ret:
                    total_retenciones += ret.total_retencion or 0
                tipo_factura = fac.tipo_factura.name if fac else "-"
                data.append([
                    nombre_arrendador,
                    formato_fecha(pago.vencimiento),
                    valor_quintales_row,
                    formato_moneda(monto_pago),
                    formato_moneda(retencion_valor) if retencion_valor != "-" else "-",
                    formato_moneda(monto_factura) if monto_factura != "-" else "-",
                    tipo_factura
                ])
            if len(data) == 1:
                data.append(["-", "-", "-", "-", "-", "-", "-"])
            else:
                total_quintales_str = f"{total_quintales:.2f} qq" if total_quintales else "-"
                data.append([
                    "TOTAL",
                    "-",
                    total_quintales_str,
                    formato_moneda(total_pagos),
                    formato_moneda(total_retenciones) if total_retenciones else "-",
                    formato_moneda(total_facturas) if total_facturas else "-",
                    "-"
                ])
            # Mantener márgenes, no estirar tabla
            table_widths = [6 * cm, 4 * cm, 3.5 * cm, 4 * cm, 4 * cm, 4 * cm, 4 * cm]
            table = Table(data, colWidths=table_widths)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Times-Roman"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("FONTNAME", (0, -1), (-1, -1), "Times-Roman"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
            ]))
            elements.append(table)
            if idx < len(arrendatarios) - 1:
                elements.append(PageBreak())
        def encabezado(canvas, doc):
            canvas.saveState()
            titulo_texto = f"Reporte de pagos {mes:02d}-{anio}"
            canvas.setFont("Times-BoldItalic", 20)
            canvas.drawCentredString(landscape(A4)[0] / 2, landscape(A4)[1] - 1 * cm, titulo_texto)
            if logo_path and os.path.exists(logo_path):
                try:
                    img = Image(logo_path, width=5 * cm, height=2 * cm)
                    img.drawOn(canvas, landscape(A4)[0] - 6 * cm, landscape(A4)[1] - 2.5 * cm)
                except Exception:
                    pass
            canvas.restoreState()
        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_reporte_facturacion_anual(db, anio_inicio: int, mes_inicio: int):
        """
        Genera un Excel con hojas por arrendatario.
        Cada hoja contiene:
        - Título arriba con el arrendatario
        - Filas = arrendadores
        - Columnas = meses del período fiscal (12 meses) + columna Total
        - Celdas = total facturado (según Facturacion.fecha_facturacion)
        - Fila extra = Totales por mes
        """
        wb = Workbook()
        wb.remove(wb.active)
        # Calcular los 12 meses fiscales
        meses = []
        anio = anio_inicio
        mes = mes_inicio
        for _ in range(12):
            meses.append((anio, mes))
            mes += 1
            if mes == 13:
                mes = 1
                anio += 1
        # Estilos
        bold_font = Font(bold=True)
        thin_border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin")
        )
        arrendatarios = db.query(Arrendatario).all()
        for arr in arrendatarios:
            sheet_title = arr.razon_social.replace("/", "-").replace("\\", "-")[:25]
            ws = wb.create_sheet(title=sheet_title)
            #Título
            ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(meses) + 2)
            titulo = ws.cell(row=1, column=1, value=f"Reporte de facturación anual - Arrendatario: {arr.razon_social}")
            titulo.font = Font(bold=True, size=14)
            titulo.alignment = Alignment(horizontal="center", vertical="center")
            #Cabecera de la tabla
            ws.cell(row=3, column=1, value="Arrendador").font = bold_font
            for col_idx, (a, m) in enumerate(meses, start=2):
                ws.cell(row=3, column=col_idx, value=f"{m:02d}-{a}").font = bold_font
            ws.cell(row=3, column=len(meses) + 2, value="TOTAL").font = bold_font
            #Buscar arrendadores relacionados
            arrendadores = (
                db.query(Arrendador)
                .join(ParticipacionArrendador, ParticipacionArrendador.arrendador_id == Arrendador.id)
                .join(Arrendamiento, Arrendamiento.id == ParticipacionArrendador.arrendamiento_id)
                .filter(Arrendamiento.arrendatario_id == arr.id)
                .distinct() 
                .all()
            )
            if not arrendadores:
                ws.cell(row=4, column=1, value="-")
                for col_idx in range(2, len(meses) + 3):
                    ws.cell(row=4, column=col_idx, value=0).number_format = '#,##0.00'
            else:
                for row_idx, arrendador in enumerate(arrendadores, start=4):
                    ws.cell(row=row_idx, column=1, value=arrendador.nombre_o_razon_social).font = bold_font
                    total_arrendador = 0
                    for col_idx, (a, m) in enumerate(meses, start=2):
                        inicio = date(a, m, 1)
                        fin = date(a + (m // 12), (m % 12) + 1, 1)
                        suma_mes = (
                            db.query(func.sum(Facturacion.monto_facturacion))
                            .join(Pago, Facturacion.pago_id == Pago.id)
                            .join(ParticipacionArrendador, Pago.participacion_arrendador_id == ParticipacionArrendador.id)
                            .join(Arrendamiento, Pago.arrendamiento_id == Arrendamiento.id) # Join explícito
                            .filter(
                                Arrendamiento.arrendatario_id == arr.id, # Filtro por arrendatario
                                ParticipacionArrendador.arrendador_id == arrendador.id, # Filtro por arrendador
                                Facturacion.fecha_facturacion >= inicio, 
                                Facturacion.fecha_facturacion < fin      
                            )
                            .scalar() or 0
                        )
                        total_arrendador += suma_mes
                        cell = ws.cell(row=row_idx, column=col_idx, value=suma_mes)
                        cell.number_format = '#,##0.00'
                        if suma_mes == 0:
                            cell.value = 0
                    total_cell = ws.cell(row=row_idx, column=len(meses) + 2, value=total_arrendador)
                    total_cell.font = bold_font
                    total_cell.number_format = '#,##0.00'
                    if total_arrendador == 0:
                        total_cell.value = 0
                total_row = len(arrendadores) + 4
                ws.cell(row=total_row, column=1, value="TOTAL").font = bold_font
                for col_idx in range(2, len(meses) + 3):
                    col_sum = sum(ws.cell(row=r, column=col_idx).value or 0 for r in range(4, total_row))
                    col_sum_cell = ws.cell(row=total_row, column=col_idx, value=col_sum)
                    col_sum_cell.font = bold_font
                    col_sum_cell.number_format = '#,##0.00'
                    if col_sum == 0:
                        col_sum_cell.value = 0
            #Bordes y alineación
            max_row = ws.max_row
            max_col = len(meses) + 2 
            for r in range(3, max_row + 1):
                for c in range(1, max_col + 1):
                    cell = ws.cell(row=r, column=c)
                    cell.border = thin_border
                    if c == 1:
                        cell.alignment = Alignment(horizontal="center", vertical="center")
                    else:
                        cell.alignment = Alignment(horizontal="center", vertical="center")
            #Ajustar anchos de columnas
            for c in range(1, max_col + 1):
                col_letter = get_column_letter(c)
                if c == 1:
                    ws.column_dimensions[col_letter].width = 35  
                else:
                    ws.column_dimensions[col_letter].width = 15
        #Guardar en memoria
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_reporte_pagos_pendientes_pdf(db, anio: int, mes: int, logo_path: str = None):
        """
        Genera un reporte en PDF con los pagos pendientes de un mes (actual o futuro),
        agrupados por arrendatario, con totales al pie.
        """
        hoy = date.today()
        # Validación: mes pasado no permitido
        if (anio < hoy.year) or (anio == hoy.year and mes < hoy.month):
            raise HTTPException(
                status_code=400,
                detail=f"Solo se pueden generar reportes del mes actual ({hoy.month:02d}-{hoy.year}) o futuro."
            )
        BASE_DIR = Path(__file__).resolve().parent.parent
        logo_path = BASE_DIR / "util" / "logo.png"
        fecha_inicio = date(anio, mes, 1)
        fecha_fin = date(anio + (mes // 12), (mes % 12) + 1, 1)
        
        hoy = date.today()
        if hoy.day == 1 and hoy.month != 1:
            primer_dia_mes_actual = date(hoy.year, hoy.month -1, 1)
        elif hoy.day == 1 and hoy.month == 1:
            primer_dia_mes_actual = date(hoy.year -1, 12, 1)
        else:
            primer_dia_mes_actual = date(hoy.year, hoy.month, 1)
        precios_mes_actual = db.query(Precio.precio_obtenido).filter(
            Precio.fecha_precio >= primer_dia_mes_actual,
            Precio.fecha_precio <= hoy,
            Precio.origen == "BCR"
        ).all()
        if precios_mes_actual:
            precio_guia_mes = (sum([p[0] for p in precios_mes_actual]) / len(precios_mes_actual)) / 10
        else:
            precio_guia_mes = 0
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1 * cm,
            leftMargin=1 * cm,
            topMargin=2.5 * cm,
            bottomMargin=1 * cm,
        )
        elements = []
        styles = getSampleStyleSheet()
        # Traer arrendatarios
        arrendatarios = db.query(Arrendatario).all()
        # Estilo tabla centralizado
        table_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Times-Roman"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTNAME", (0, -1), (-1, -1), "Times-Roman"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
        ])
        for idx, arr in enumerate(arrendatarios):
            titulo = Paragraph(f"<b>Arrendatario: {arr.razon_social}</b>", styles["Heading2"])
            elements.append(titulo)
            elements.append(Spacer(1, 0.5 * cm))
            # Encabezado de tabla
            data = [["Arrendador", "Vencimiento", "Quintales / Porcentaje", "Monto a Pagar", "Consulta precio de", "Tiene Retención"]]
            total_pagos = Decimal("0.0")
            total_quintales = 0
            processed_pagos_for_quintales = set()  # para no sumar quintales varias veces
            # Traer arrendamientos
            arrendamientos = db.query(Arrendamiento).filter(Arrendamiento.arrendatario_id == arr.id).all()
            for arrendamiento in arrendamientos:
                # Traer pagos pendientes junto con sus participaciones y arrendadores en un solo query
                pagos_con_arrendadores = (
                    db.query(Pago, ParticipacionArrendador, Arrendador)
                    .join(ParticipacionArrendador, Pago.participacion_arrendador_id == ParticipacionArrendador.id)
                    .join(Arrendador, Arrendador.id == ParticipacionArrendador.arrendador_id)
                    .filter(
                        Pago.arrendamiento_id == arrendamiento.id,
                        Pago.vencimiento >= fecha_inicio,
                        Pago.vencimiento < fecha_fin,
                        Pago.estado == "PENDIENTE"
                    )
                    .all()
                )
                if not pagos_con_arrendadores:
                    continue
                for pago, participacion, arrendador in pagos_con_arrendadores:
                    # formateo del campo quintales/porcentaje por fila
                    if getattr(pago, "quintales", None) is not None:
                        quintales_val = float(pago.quintales)
                        valor_quintales_row = f"{quintales_val:.2f} qq"
                    elif getattr(pago, "porcentaje", None) is not None:
                        valor_quintales_row = f"{pago.porcentaje}%"
                    else:
                        valor_quintales_row = "-"
                    nombre_arrendador = arrendador.nombre_o_razon_social
                    fuente_precio = pago.fuente_precio.name if pago.fuente_precio else "-"
                    tiene_retencion = "NO" if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA else "SI"
                    # Sumar monto
                    if pago.monto_a_pagar is not None:
                        monto_a_sumar = pago.monto_a_pagar
                        monto_a_mostrar = formato_moneda(monto_a_sumar)
                    elif getattr(pago, "quintales", None) is not None:
                        monto_a_sumar = precio_guia_mes * Decimal(pago.quintales)
                        monto_a_mostrar = formato_moneda(monto_a_sumar) + " *"
                    else:
                        monto_a_sumar = 0
                        monto_a_mostrar = formato_moneda(0)
                    total_pagos += Decimal(monto_a_sumar)                
                    # Sumar quintales: solo una vez por pago
                    pago_id = getattr(pago, "id", id(pago))
                    if pago_id not in processed_pagos_for_quintales:
                        if getattr(pago, "quintales", None) is not None:
                            try:
                                total_quintales += float(pago.quintales)
                            except Exception:
                                pass
                        processed_pagos_for_quintales.add(pago_id)
                    data.append([
                        nombre_arrendador,
                        formato_fecha(pago.vencimiento),
                        valor_quintales_row,
                        monto_a_mostrar,
                        fuente_precio,
                        tiene_retencion
                    ])
            # Si no agregamos filas (solo cabecera), agregamos fila vacía
            if len(data) == 1:
                data.append(["-", "-", "-", "-", "-", "-"])
            else:
                # Formatear total de quintales
                if total_quintales == 0:
                    total_quintales_str = "0 qq"
                else:
                    total_quintales_str = f"{total_quintales:.2f} qq"
                data.append([
                    "TOTAL",
                    "-",
                    total_quintales_str,
                    formato_moneda(float(total_pagos)),
                    "-",
                    "-"
                ])
            table = Table(
                data,
                colWidths=[7 * cm, 4 * cm, 4 * cm, 6 * cm, 4 * cm, 4 * cm]
            )
            table.setStyle(table_style)
            elements.append(table)
            # Nota aclaratoria al final de cada hoja
            nota = Paragraph(
                f'<font size="9" color="grey"><i>Nota: Los montos marcados con (*) se calcularon usando precio guía de BCR {formato_moneda(precio_guia_mes)} (promedio del mes {primer_dia_mes_actual.month}/{primer_dia_mes_actual.year}).</i></font>',
                styles["Normal"]
            )
            elements.append(Spacer(1, 0.4 * cm))
            elements.append(nota)
            if idx < len(arrendatarios) - 1:
                elements.append(PageBreak())
        # ---- Encabezado con título + logo ----
        def encabezado(canvas, doc):
            canvas.saveState()
            titulo_texto = f"Reporte de pagos pendientes {mes:02d}-{anio}"
            canvas.setFont("Times-BoldItalic", 20)
            canvas.drawCentredString(landscape(A4)[0] / 2, landscape(A4)[1] - 1 * cm, titulo_texto)
            if logo_path and os.path.exists(logo_path):
                try:
                    img = Image(logo_path, width=5 * cm, height=2 * cm)
                    img.drawOn(canvas, landscape(A4)[0] - 6 * cm, landscape(A4)[1] - 2.5 * cm)
                except Exception:
                    pass
            canvas.restoreState()
        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_reporte_por_arrendador_pdf(db, arrendador_id: int, fecha_inicio: date, fecha_fin: date, logo_path: str = None):
        """
        Genera un reporte en PDF con los pagos de un arrendador
        específico en un rango de fechas.
        """
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado")
        if fecha_inicio > fecha_fin:
            raise HTTPException(status_code=422, detail="La fecha de inicio no puede ser mayor a la fecha de fin del reporte")
        BASE_DIR = Path(__file__).resolve().parent.parent
        logo_path_default = BASE_DIR / "util" / "logo.png"
        logo_path = logo_path or logo_path_default
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1 * cm,
            leftMargin=1 * cm,
            topMargin=3 * cm,
            bottomMargin=1 * cm,
        )
        elements = []
        styles = getSampleStyleSheet()
        hoy = date.today()
        if hoy.day == 1 and hoy.month != 1:
            primer_dia_mes_actual = date(hoy.year, hoy.month -1, 1)
        elif hoy.day == 1 and hoy.month == 1:
            primer_dia_mes_actual = date(hoy.year -1, 12, 1)
        else:
            primer_dia_mes_actual = date(hoy.year, hoy.month, 1)
        precios_mes_actual = db.query(Precio.precio_obtenido).filter(
            Precio.fecha_precio >= primer_dia_mes_actual,
            Precio.fecha_precio <= hoy,
            Precio.origen == "BCR"
        ).all()
        if precios_mes_actual:
            suma_precios = sum([p[0] for p in precios_mes_actual])
            precio_guia_mes = (suma_precios / Decimal(len(precios_mes_actual))) / Decimal("10.0")
        else:
            precio_guia_mes = Decimal("0.0")
        titulo = Paragraph(f"<b>Arrendador: {arrendador.nombre_o_razon_social}</b>", styles["Heading2"])
        elements.append(titulo)
        subtitulo_rango = f"Tabla de pagos del arrendador entre {formato_fecha(fecha_inicio)} y {formato_fecha(fecha_fin)}"
        elements.append(Paragraph(subtitulo_rango, styles["Normal"]))
        elements.append(Spacer(1, 0.5 * cm))
        pagos_query = (
            db.query(Pago)
            .join(ParticipacionArrendador, Pago.participacion_arrendador_id == ParticipacionArrendador.id)
            .filter(
                ParticipacionArrendador.arrendador_id == arrendador_id,
                Pago.vencimiento >= fecha_inicio,
                Pago.vencimiento <= fecha_fin,
                Pago.estado != "CANCELADO"
            )
            .order_by(Pago.vencimiento)
            .all()
        )
        data = [["N° Pago", "Estado", "Vencimiento", "Quintales / Porcentaje", "Monto", "Tiene Retención"]]
        total_pagos = Decimal("0.0")
        total_quintales = 0.0
        table_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Times-Roman"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTNAME", (0, -1), (-1, -1), "Times-Roman"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
        ])
        tiene_retencion_str = "NO" if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA else "SI"
        for pago in pagos_query:
            if pago.quintales is not None:
                quintales_val = pago.quintales # Ya es float
                valor_quintales_row = f"{quintales_val:.2f} qq"
                total_quintales += quintales_val
            elif pago.porcentaje is not None:
                valor_quintales_row = f"{pago.porcentaje}%"
            else:
                valor_quintales_row = "-"
            if pago.monto_a_pagar is not None:
                monto_a_sumar = pago.monto_a_pagar # Ya es Decimal
                monto_a_mostrar = formato_moneda(monto_a_sumar)
            elif pago.quintales is not None:
                monto_a_sumar = precio_guia_mes * Decimal(pago.quintales)
                monto_a_mostrar = formato_moneda(monto_a_sumar) + " *"
            else:
                monto_a_sumar = Decimal("0.0")
                monto_a_mostrar = formato_moneda(0)
            total_pagos += monto_a_sumar
            data.append([
                pago.id,
                pago.estado.value,
                formato_fecha(pago.vencimiento),
                valor_quintales_row,
                monto_a_mostrar,
                tiene_retencion_str
            ])
        if len(data) == 1:
            data.append(["-", "-", "-", "-", "-", "-"])
        else:
            total_quintales_str = f"{total_quintales:.2f} qq" if total_quintales else "0 qq"
            data.append([
                "TOTAL",
                "-",
                "-",
                total_quintales_str,
                formato_moneda(total_pagos),
                "-"
            ])
        table = Table(
            data,
            colWidths=[3 * cm, 4 * cm, 4 * cm, 4 * cm, 6 * cm, 4 * cm]
        )
        table.setStyle(table_style)
        elements.append(table)
        if "*" in str(data):
            nota_texto = f'<font size="9" color="grey"><i>Nota: Los montos marcados con (*) se calcularon usando precio guía de BCR {formato_moneda(precio_guia_mes)} (promedio del mes {primer_dia_mes_actual.month}/{primer_dia_mes_actual.year}).</i></font>'
            nota = Paragraph(nota_texto, styles["Normal"])
            elements.append(Spacer(1, 0.4 * cm))
            elements.append(nota)
        def encabezado(canvas, doc):
            canvas.saveState()
            titulo_texto = f"Reporte de Pagos"
            canvas.setFont("Times-BoldItalic", 20)
            canvas.drawCentredString(landscape(A4)[0] / 2, landscape(A4)[1] - 1 * cm, titulo_texto)
            subtitulo_texto = f"Arrendador: {arrendador.nombre_o_razon_social}"
            canvas.setFont("Times-Italic", 14)
            canvas.drawCentredString(landscape(A4)[0] / 2, landscape(A4)[1] - 1.8 * cm, subtitulo_texto)
            if logo_path and os.path.exists(logo_path):
                try:
                    img = ImageReader(logo_path)
                    img_width, img_height = img.getSize()
                    aspect = img_height / float(img_width)
                    display_width = 5 * cm
                    display_height = display_width * aspect
                    max_height = 2.5 * cm 
                    if display_height > max_height:
                        display_height = max_height
                        display_width = display_height / aspect
                    canvas.drawImage(logo_path, 
                                    doc.leftMargin, 
                                     landscape(A4)[1] - 2.5 * cm, 
                                    width=display_width, 
                                    height=display_height,
                                    preserveAspectRatio=True,
                                    mask='auto')
                except Exception:
                    pass
            canvas.restoreState()
        doc.build(elements, onFirstPage=encabezado, onLaterPages=encabezado)
        buffer.seek(0)
        return buffer