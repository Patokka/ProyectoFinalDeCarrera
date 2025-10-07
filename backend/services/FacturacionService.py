from datetime import date

from sqlalchemy import asc
from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enums.EstadoPago import EstadoPago
from enums.TipoCondicion import TipoCondicion
from enums.TipoFactura import TipoFactura
from services.ArrendamientoService import ArrendamientoService
from services.ArrendatarioService import ArrendatarioService
from services.ArrendadorService import ArrendadorService
from services.PagoService import PagoService
from services.RetencionService import RetencionService
from model.Facturacion import Facturacion
from model.Arrendamiento import Arrendamiento
from model.Pago import Pago
from dtos.FacturacionDto import FacturacionDtoModificacion

class FacturacionService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Facturacion).order_by(asc(Facturacion.fecha_facturacion)).all()

    @staticmethod
    def obtener_por_id(db: Session, facturacion_id: int):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, pago_id: int):
        #verifica si existe el pago y si no existe retorna un 404
        pago = PagoService.obtener_por_id(db, pago_id)
        
        if pago.estado == EstadoPago.REALIZADO or pago.estado == EstadoPago.CANCELADO:
            raise HTTPException(status_code=500, detail= "El pago ya fue facturado o está cancelado.")
        
        #verifica si existe el arrendador y si no existe retorna un 404
        arrendador = ArrendadorService.obtener_por_id(db, pago.participacion_arrendador.arrendador_id)
        hoy = date.today()
        
        # Caso especial de pago a porcentaje
        if pago.porcentaje and pago.porcentaje > 0:
            pago.estado = EstadoPago.REALIZADO
            db.commit()
            ArrendamientoService.finalizar_arrendamiento(db, pago.arrendamiento_id)
            # Crear objeto Facturacion "dummy" en memoria
            return {
                "id": 0,
                "tipo_factura": TipoFactura.A,
                "fecha_facturacion": hoy,
                "monto_facturacion": 0,
                "arrendador_id": pago.participacion_arrendador.arrendador_id,
                "pago_id": pago.id,
            }
        
        #Verifica si el pago ya tiene asignado el precio promedio por quintal, sino devuelve error
        if not (pago.precio_promedio or pago.monto_a_pagar or pago.precio_promedio == 0 or pago.monto_a_pagar == 0):
            raise HTTPException(status_code=500, detail= "El pago no tiene un precio y/o monto asignado.")
        
        if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA:
            tipo = TipoFactura.C
            nuevo = Facturacion(
                tipo_factura = tipo,
                fecha_facturacion = hoy,
                monto_facturacion = pago.monto_a_pagar,
                arrendador_id = arrendador.id,
                pago_id = pago_id
            )
            db.add(nuevo)

        else:
            tipo = TipoFactura.A
            # delegamos la creación de la retención al service
            retencion = RetencionService.crear_para_factura(db, arrendador.id, pago, hoy)

            nuevo = Facturacion(
                tipo_factura=tipo,
                fecha_facturacion=hoy,
                monto_facturacion=pago.monto_a_pagar - retencion.total_retencion,
                arrendador_id=arrendador.id,
                pago_id= pago_id
            )
            db.add(nuevo)
            db.flush()

            # relacionamos la retención con la factura creada
            retencion.facturacion_id = nuevo.id
            
        pago.estado = EstadoPago.REALIZADO
        db.commit()
        db.refresh(nuevo)
        ArrendamientoService.finalizar_arrendamiento(db, pago.arrendamiento_id)
        return nuevo

    @staticmethod
    def actualizar(db: Session, facturacion_id: int, dto: FacturacionDtoModificacion):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, facturacion_id: int):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_facturaciones_arrendador(db: Session, arrendador_id: int):
        #Solamente se consulta el arrendador para obtener la excepción en caso de que no exista        
        ArrendadorService.obtener_por_id(db,arrendador_id)
        
        facturaciones = db.query(Facturacion).filter(
            Facturacion.arrendador_id == arrendador_id
        ).all()
        return facturaciones

    @staticmethod
    def obtener_facturaciones_arrendatario(db: Session, arrendatario_id: int):
        #Solamente se consulta el arrendatario para obtener la excepción en caso de que no exista        
        ArrendatarioService.obtener_por_id(db,arrendatario_id)
        
        # Hacer join de Facturacion para llegar al arrendatario
        facturaciones = (
            db.query(Facturacion)
            .join(Pago, Facturacion.pago_id == Pago.id)
            .join(Arrendamiento, Pago.arrendamiento_id == Arrendamiento.id)
            .filter(Arrendamiento.arrendatario_id == arrendatario_id)
            .all()
        )
        return facturaciones