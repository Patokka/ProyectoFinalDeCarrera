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
from dtos.ArrendadorDto import  ArrendadorDtoOut
from dtos.PagoDto import  PagoDtoOut

class FacturacionService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de facturaciones.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todas las facturaciones de la base de datos, ordenadas por fecha.
        Args:
            db (Session): La sesión de la base de datos.
        Returns:
            list[Facturacion]: Una lista de todas las facturaciones.
        """
        return db.query(Facturacion).order_by(asc(Facturacion.fecha_facturacion)).all()

    @staticmethod
    def obtener_por_id(db: Session, facturacion_id: int):
        """
        Obtiene una facturación por su ID.
        Args:
            db (Session): La sesión de la base de datos.
            facturacion_id (int): El ID de la facturación a buscar.
        Returns:
            Facturacion: La facturación encontrada.
        Raises:
            HTTPException: Si la facturación no se encuentra (código 404).
        """
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, pago_id: int):
        """
        Crea una nueva facturación para un pago específico.
        Cambia el estado del pago a 'REALIZADO'.
        Si el arrendador no es monotributista, también crea una retención asociada.
        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago a facturar.
        Returns:
            Facturacion: La facturación recién creada.
        Raises:
            HTTPException: Si el pago ya fue facturado/cancelado (500) o si no tiene
                        un monto asignado (500).
        """
        pago = PagoService.obtener_por_id(db, pago_id)        
        if pago.estado == EstadoPago.REALIZADO or pago.estado == EstadoPago.CANCELADO:
            raise HTTPException(status_code=500, detail= "El pago ya fue facturado o está cancelado.")
        arrendador = ArrendadorService.obtener_por_id(db, pago.participacion_arrendador.arrendador_id)
        hoy = date.today()
        if pago.porcentaje and pago.porcentaje > 0:
            pago.estado = EstadoPago.REALIZADO
            db.commit()
            ArrendamientoService.finalizar_arrendamiento(db, pago.arrendamiento_id)
            return Facturacion(
                id= 0,
                tipo_factura= TipoFactura.A,
                fecha_facturacion= hoy,
                monto_facturacion= 0,
                arrendador=ArrendadorDtoOut.model_validate(arrendador),
                pago=PagoDtoOut.model_validate(pago)
            )
        if not (pago.precio_promedio or pago.monto_a_pagar or pago.precio_promedio == 0 or pago.monto_a_pagar == 0):
            raise HTTPException(status_code=500, detail= "El pago no tiene un precio y/o monto asignado.")
        monto_bruto = pago.monto_a_pagar
        monto_neto_pago = monto_bruto
        if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA:
            tipo = TipoFactura.C
            nuevo = Facturacion(
                tipo_factura = tipo,
                fecha_facturacion = hoy,
                monto_facturacion = monto_bruto,
                arrendador_id = arrendador.id,
                pago_id = pago_id
            )
            db.add(nuevo)
        else: # (Responsable Inscripto, etc. -> Factura A)
            tipo = TipoFactura.A
            retencion = RetencionService.crear_para_factura(db, arrendador.id, pago, hoy)
            monto_facturacion_bruto = monto_bruto
            monto_neto_pago = monto_bruto - retencion.total_retencion  
            nuevo = Facturacion(
                tipo_factura=tipo,
                fecha_facturacion=hoy,
                monto_facturacion=monto_facturacion_bruto,
                arrendador_id=arrendador.id,
                pago_id= pago_id
            )
            db.add(nuevo)
            db.flush()
            retencion.facturacion_id = nuevo.id
            db.add(retencion)
        pago.estado = EstadoPago.REALIZADO
        pago.monto_a_pagar = monto_neto_pago
        
        db.commit()
        db.refresh(nuevo)
        ArrendamientoService.finalizar_arrendamiento(db, pago.arrendamiento_id)
        return nuevo

    @staticmethod
    def actualizar(db: Session, facturacion_id: int, dto: FacturacionDtoModificacion):
        """
        Actualiza los datos de una facturación existente.
        Args:
            db (Session): La sesión de la base de datos.
            facturacion_id (int): El ID de la facturación a actualizar.
            dto (FacturacionDtoModificacion): Los datos a modificar.
        Returns:
            Facturacion: La facturación actualizada.
        Raises:
            HTTPException: Si la facturación no se encuentra (código 404).
        """
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
        """
        Elimina una facturación de la base de datos.
        Args:
            db (Session): La sesión de la base de datos.
            facturacion_id (int): El ID de la facturación a eliminar.
        Raises:
            HTTPException: Si la facturación no se encuentra (404) o si tiene
                        relaciones que impiden su eliminación.
        """
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_facturaciones_arrendador(db: Session, arrendador_id: int):
        """
        Obtiene todas las facturaciones asociadas a un arrendador.
        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador.
        Returns:
            list[Facturacion]: Lista de facturaciones del arrendador.
        """
        ArrendadorService.obtener_por_id(db,arrendador_id)
        
        facturaciones = db.query(Facturacion).filter(
            Facturacion.arrendador_id == arrendador_id
        ).all()
        return facturaciones

    @staticmethod
    def obtener_facturaciones_arrendatario(db: Session, arrendatario_id: int):
        """
        Obtiene todas las facturaciones asociadas a un arrendatario a través de sus arrendamientos y pagos.
        Args:
            db (Session): La sesión de la base de datos.
            arrendatario_id (int): El ID del arrendatario.
        Returns:
            list[Facturacion]: Lista de facturaciones del arrendatario.
        """
        ArrendatarioService.obtener_por_id(db,arrendatario_id)

        facturaciones = (
            db.query(Facturacion)
            .join(Pago, Facturacion.pago_id == Pago.id)
            .join(Arrendamiento, Pago.arrendamiento_id == Arrendamiento.id)
            .filter(Arrendamiento.arrendatario_id == arrendatario_id)
            .all()
        )
        return facturaciones