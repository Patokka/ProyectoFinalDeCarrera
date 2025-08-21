import io
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from datetime import date

from backend.model.Arrendatario import Arrendatario
from backend.model.Arrendamiento import Arrendamiento
from backend.model.Pago import Pago
from backend.model.Facturacion import Facturacion
from backend.model.Retencion import Retencion


class ReporteService:

    @staticmethod
    def generar_reporte_mensual_pdf(db, anio: int, mes: int):
        """
        Genera un reporte mensual en memoria (BytesIO),
        agrupado por arrendatario, y devuelve el buffer listo para enviar.
        """

        # Definir rango de fechas
        fecha_inicio = date(anio, mes, 1)
        fecha_fin = date(anio + (mes // 12), (mes % 12) + 1, 1)

        # Crear buffer en memoria
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Título
        c.setFont("Helvetica-Bold", 16)
        c.drawString(2 * cm, height - 2 * cm, f"Reporte Mensual - {mes}/{anio}")

        y = height - 3 * cm
        c.setFont("Helvetica", 10)

        arrendatarios = db.query(Arrendatario).all()

        for arr in arrendatarios:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(2 * cm, y, f"Arrendatario: {arr.razon_social}")
            y -= 0.5 * cm

            arrendamientos = db.query(Arrendamiento).filter(
                Arrendamiento.arrendatario_id == arr.id
            ).all()

            if not arrendamientos:
                c.setFont("Helvetica-Oblique", 10)
                c.drawString(3 * cm, y, "Sin arrendamientos registrados.")
                y -= 0.7 * cm
                continue

            tuvo_pagos = False

            for arrendamiento in arrendamientos:
                pagos = db.query(Pago).filter(
                    Pago.arrendamiento_id == arrendamiento.id,
                    Pago.vencimiento >= fecha_inicio,
                    Pago.vencimiento < fecha_fin,
                ).all()

                for pago in pagos:
                    tuvo_pagos = True
                    c.setFont("Helvetica", 10)
                    c.drawString(3 * cm, y,
                        f"Pago #{pago.id} - Fecha: {pago.vencimiento} - Monto: {pago.monto_a_pagar}"
                    )
                    y -= 0.5 * cm

                    facturas = db.query(Facturacion).filter(
                        Facturacion.pago_id == pago.id
                    ).all()

                    for fac in facturas:
                        c.drawString(4 * cm, y,
                            f"Factura #{fac.id} - Tipo: {fac.tipo_factura.name} - "
                            f"Fecha: {fac.fecha_facturacion} - Monto: {fac.monto_facturacion}"
                        )
                        y -= 0.5 * cm

                        retenciones = db.query(Retencion).filter(
                            Retencion.facturacion_id == fac.id
                        ).all()

                        for r in retenciones:
                            c.drawString(5 * cm, y,
                                f"Retención #{r.id} - Fecha: {r.fecha_retencion} - Monto: {r.total_retencion}"
                            )
                            y -= 0.5 * cm

                    y -= 0.3 * cm

                y -= 0.5 * cm

                if y < 3 * cm:  # salto de página
                    c.showPage()
                    y = height - 3 * cm

            if not tuvo_pagos:
                c.setFont("Helvetica-Oblique", 10)
                c.drawString(3 * cm, y, "Sin pagos en este período.")
                y -= 0.7 * cm

        c.save()
        buffer.seek(0)
        return buffer