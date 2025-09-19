from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enums.EstadoPago import EstadoPago
from enums.TipoCondicion import TipoCondicion
from enums.TipoFactura import TipoFactura
from services.ArrendadorService import ArrendadorService
from services.PagoService import PagoService
from services.RetencionService import RetencionService
from model.Facturacion import Facturacion
from dtos.FacturacionDto import FacturacionDtoModificacion

class FacturacionService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Facturacion).all()

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
        arrendador = pago.participacion_arrendador.arrendador
        hoy = date.today()
        
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
