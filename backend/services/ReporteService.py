import io
import os
from datetime import date
from pathlib import Path
from fastapi import HTTPException
from reportlab.lib.pagesizes import A4, landscape
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
from sqlalchemy import func
from backend.model.Arrendador import Arrendador
from backend.model.Arrendatario import Arrendatario
from backend.model.Arrendamiento import Arrendamiento
from backend.model.Pago import Pago
from backend.model.Facturacion import Facturacion
from backend.model.ParticipacionArrendador import ParticipacionArrendador
from backend.model.Retencion import Retencion


def formato_fecha(fecha):
    return fecha.strftime("%d-%m-%Y") if fecha else "-"


def formato_moneda(valor):
    if valor is None:
        return "-"
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

class ReporteService:

    @staticmethod
    def generar_reporte_mensual_pdf(db, anio: int, mes: int, logo_path: str = None):
        """
        Genera un reporte mensual,
        agrupado por arrendatario, en formato tabla horizontal.
        Incluye título centrado, logo y totales por arrendatario.
        """
        hoy = date.today()

        # Calculamos el último mes permitido (mes anterior al actual)
        if hoy.month == 1:
            ultimo_anio = hoy.year - 1
            ultimo_mes = 12
        else:
            ultimo_anio = hoy.year
            ultimo_mes = hoy.month - 1

        # Si el año/mes pedido es mayor al último permitido => error
        if (anio > ultimo_anio) or (anio == ultimo_anio and mes > ultimo_mes):
            raise HTTPException(
                status_code=400,
                detail=f"Solo se pueden generar reportes hasta {ultimo_mes:02d}-{ultimo_anio}. "
                    f"El mes actual ({hoy.month:02d}-{hoy.year}) y meses futuros no están permitidos."
            )
        
        BASE_DIR = Path(__file__).resolve().parent.parent  # apunta a /backend
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

            data = [["Razón Social Arrendador", "Vencimiento", "Monto a Pagar", "Retención", "Monto Factura", "Tipo Factura"]]

            # acumuladores de totales
            total_pagos = 0
            total_retenciones = 0
            total_facturas = 0

            arrendamientos = db.query(Arrendamiento).filter(
                Arrendamiento.arrendatario_id == arr.id
            ).all()

            for arrendamiento in arrendamientos:
                pagos = db.query(Pago).filter(
                    Pago.arrendamiento_id == arrendamiento.id,
                    Pago.vencimiento >= fecha_inicio,
                    Pago.vencimiento < fecha_fin,
                ).all()

                for pago in pagos:
                    participaciones = db.query(ParticipacionArrendador).filter(
                        ParticipacionArrendador.arrendamiento_id == arrendamiento.id
                    ).all()

                    for participacion in participaciones:
                        arrendador = db.query(Arrendador).filter(Arrendador.id == participacion.arrendador_id).first()
                        nombre_arrendador = arrendador.nombre_o_razon_social if arrendador else "-"

                        facturas = db.query(Facturacion).filter(Facturacion.pago_id == pago.id).all()

                        # acumula monto pago
                        total_pagos += pago.monto_a_pagar or 0

                        if not facturas:
                            data.append([
                                nombre_arrendador,
                                formato_fecha(pago.vencimiento),
                                formato_moneda(pago.monto_a_pagar),
                                "-",
                                "-",
                                "-"
                            ])
                        else:
                            for fac in facturas:
                                total_facturas += fac.monto_facturacion or 0

                                retenciones = db.query(Retencion).filter(Retencion.facturacion_id == fac.id).all()
                                if not retenciones:
                                    data.append([
                                        nombre_arrendador,
                                        formato_fecha(pago.vencimiento),
                                        formato_moneda(pago.monto_a_pagar),
                                        "-",
                                        formato_moneda(fac.monto_facturacion),
                                        fac.tipo_factura.name
                                    ])
                                else:
                                    for r in retenciones:
                                        total_retenciones += r.total_retencion or 0
                                        data.append([
                                            nombre_arrendador,
                                            formato_fecha(pago.vencimiento),
                                            formato_moneda(pago.monto_a_pagar),
                                            formato_moneda(r.total_retencion),
                                            formato_moneda(fac.monto_facturacion),
                                            fac.tipo_factura.name
                                        ])

            if len(data) == 1:
                data.append(["-", "-", "-", "-", "-", "-"])
            else:
                # fila de totales
                data.append([
                    "TOTAL",
                    "-",
                    formato_moneda(total_pagos),
                    formato_moneda(total_retenciones) if total_retenciones else "-",
                    formato_moneda(total_facturas) if total_facturas else "-",
                    "-"
                ])

            table = Table(
                data,
                colWidths=[7 * cm, 4 * cm, 4 * cm, 4 * cm, 4 * cm, 4 * cm]
            )

            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Times-Roman"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                # estilos fila de totales
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
        Cada hoja contiene una tabla con:
        - Filas = arrendadores
        - Columnas = meses del período fiscal (12 meses) + columna Total
        - Celdas = total facturado
        - Fila extra = Totales por mes
        """

        wb = Workbook()
        wb.remove(wb.active)  # borrar hoja por defecto

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
            ws = wb.create_sheet(title=arr.razon_social[:25])  # limitar a 25 caracteres

            # Cabecera
            ws.cell(row=1, column=1, value="Arrendador").font = bold_font
            for col_idx, (a, m) in enumerate(meses, start=2):
                ws.cell(row=1, column=col_idx, value=f"{m:02d}-{a}").font = bold_font
            ws.cell(row=1, column=len(meses) + 2, value="TOTAL").font = bold_font

            # Buscar arrendadores relacionados
            arrendadores = (
                db.query(Arrendador)
                .join(ParticipacionArrendador, ParticipacionArrendador.arrendador_id == Arrendador.id)
                .join(Arrendamiento, Arrendamiento.id == ParticipacionArrendador.arrendamiento_id)
                .filter(Arrendamiento.arrendatario_id == arr.id)
                .all()
            )

            if not arrendadores:
                # Si no hay arrendadores → fila con guiones
                ws.cell(row=2, column=1, value="-")
                for col_idx in range(2, len(meses) + 3):
                    ws.cell(row=2, column=col_idx, value="-")
            else:
                for row_idx, arrendador in enumerate(arrendadores, start=2):
                    ws.cell(row=row_idx, column=1, value=arrendador.nombre_o_razon_social).font = bold_font
                    total_arrendador = 0

                    for col_idx, (a, m) in enumerate(meses, start=2):
                        inicio = date(a, m, 1)
                        fin = date(a + (m // 12), (m % 12) + 1, 1)

                        # total facturado en ese mes
                        total_mes = (
                            db.query(Facturacion.monto_facturacion)
                            .join(Pago, Facturacion.pago_id == Pago.id)
                            .join(Arrendamiento, Arrendamiento.id == Pago.arrendamiento_id)
                            .join(ParticipacionArrendador, ParticipacionArrendador.arrendamiento_id == Arrendamiento.id)
                            .filter(
                                Arrendamiento.arrendatario_id == arr.id,
                                ParticipacionArrendador.arrendador_id == arrendador.id,
                                Facturacion.fecha_facturacion >= inicio,
                                Facturacion.fecha_facturacion < fin
                            )
                            .all()
                        )

                        suma_mes = sum([f[0] for f in total_mes]) if total_mes else 0
                        total_arrendador += suma_mes

                        ws.cell(row=row_idx, column=col_idx, value=suma_mes)

                    # Columna total
                    ws.cell(row=row_idx, column=len(meses) + 2, value=total_arrendador).font = bold_font

                # Fila de totales por mes
                total_row = len(arrendadores) + 2
                ws.cell(row=total_row, column=1, value="TOTAL").font = bold_font
                for col_idx in range(2, len(meses) + 3):
                    col_sum = sum(ws.cell(row=r, column=col_idx).value or 0 for r in range(2, total_row))
                    ws.cell(row=total_row, column=col_idx, value=col_sum).font = bold_font

            # Aplicar bordes a toda la tabla
            max_row = ws.max_row
            max_col = ws.max_column
            for r in range(1, max_row + 1):
                for c in range(1, max_col + 1):
                    cell = ws.cell(row=r, column=c)
                    cell.border = thin_border
                    cell.alignment = Alignment(horizontal="center", vertical="center")

        # Guardar en memoria
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer