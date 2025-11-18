from datetime import date
from decimal import Decimal

from sqlalchemy import asc
from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enums.PlazoPago import PlazoPago
from enums.TipoCondicion import TipoCondicion
from services.ArrendadorService import ArrendadorService
from services.ArrendamientoService import ArrendamientoService
from model.Retencion import Retencion
from dtos.RetencionDto import RetencionDto, RetencionDtoModificacion
from util.Configuracion import Configuracion
class RetencionService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de retenciones
    y la configuración del sistema relacionada.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todas las retenciones de la base de datos, ordenadas por fecha.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Retencion]: Una lista de todas las retenciones.
        """
        return db.query(Retencion).order_by(asc(Retencion.fecha_retencion)).all()

    @staticmethod
    def obtener_por_id(db: Session, retencion_id: int):
        """
        Obtiene una retención por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            retencion_id (int): El ID de la retención a buscar.

        Returns:
            Retencion: La retención encontrada.

        Raises:
            HTTPException: Si la retención no se encuentra (código 404).
        """
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, dto: RetencionDto):
        """
        Crea una nueva retención en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (RetencionDto): Los datos de la retención a crear.

        Returns:
            Retencion: La retención recién creada.
        
        Raises:
            HTTPException: Si el arrendador es monotributista (400).
        """
        arrendador = ArrendadorService.obtener_por_id(db, dto.arrendador_id)
        if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA:
            raise HTTPException(status_code=400, detail="No se pueden aplicar retenciones a monotributistas.")
        nuevo = Retencion(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, retencion_id: int, dto: RetencionDtoModificacion):
        """
        Actualiza los datos de una retención existente.

        Args:
            db (Session): La sesión de la base de datos.
            retencion_id (int): El ID de la retención a actualizar.
            dto (RetencionDtoModificacion): Los datos a modificar.

        Returns:
            Retencion: La retención actualizada.

        Raises:
            HTTPException: Si la retención no se encuentra (código 404).
        """
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, retencion_id: int):
        """
        Elimina una retención de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            retencion_id (int): El ID de la retención a eliminar.

        Raises:
            HTTPException: Si la retención no se encuentra (404).
        """
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_retenciones_arrendador(db: Session, arrendador_id: int):
        """
        Obtiene todas las retenciones asociadas a un arrendador.

        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador.

        Returns:
            list[Retencion]: Lista de retenciones del arrendador.
        """
        return db.query(Retencion).filter(Retencion.arrendador_id == arrendador_id).all()
    
    @staticmethod
    def obtener_configuracion(db: Session, clave: str) -> str | None:
        """
        Obtiene el valor de una clave de configuración del sistema.

        Args:
            db (Session): La sesión de la base de datos.
            clave (str): La clave de configuración a buscar.

        Returns:
            str | None: El valor de la configuración o None si no se encuentra.
        """
        config = db.query(Configuracion).filter_by(clave=clave).first()
        return config.valor if config else None

    @staticmethod
    def actualizar_configuracion(db: Session, clave: str, valor: str) -> dict:
        """
        Crea o actualiza un par clave-valor en la configuración del sistema.

        Args:
            db (Session): La sesión de la base de datos.
            clave (str): La clave de configuración.
            valor (str): El nuevo valor.

        Returns:
            dict: Un mensaje de confirmación con la clave y el valor.
        """
        config = db.query(Configuracion).filter_by(clave=clave).first()
        if config:
            config.valor = valor
        else:
            config = Configuracion(clave=clave, valor=valor)
            db.add(config)
        db.commit()
        return {"status": "ok", "clave": clave, "valor": valor}
    
    @staticmethod
    def eliminar_configuracion(db: Session, clave: str) -> dict:
        """
        Elimina una clave de configuración del sistema.

        Args:
            db (Session): La sesión de la base de datos.
            clave (str): La clave a eliminar.

        Returns:
            dict: Un mensaje de confirmación.
        """
        config = db.query(Configuracion).filter_by(clave=clave).first()
        if not config:
            raise HTTPException(status_code=404, detail=f"No se encontró la clave {clave}")
        db.delete(config)
        db.commit()
        return {"status": "ok"}
    
    @staticmethod
    def obtener_destinatarios(db: Session) -> list[str]:
        """
        Obtiene la lista de correos electrónicos configurados como destinatarios.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[str]: Lista de direcciones de correo.
        """
        registros = db.query(Configuracion).filter(Configuracion.clave.like("DESTINATARIO%")).all()
        return [r.valor for r in registros if r.valor]
    
    @staticmethod
    def crear_para_factura(db: Session, arrendador_id: int, pago, fecha: date):
        """
        Calcula y crea una retención para un pago específico en el momento de la facturación.

        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador.
            pago (Pago): El objeto de pago.
            fecha (date): La fecha de la retención.

        Returns:
            Retencion: La instancia de la retención creada (sin persistir en la DB).
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db, pago.arrendamiento_id)
        minimo_imponible = float(RetencionService.obtener_configuracion(db, "MINIMO_IMPONIBLE") or 0)

        periodos = {PlazoPago.MENSUAL: 1, PlazoPago.BIMESTRAL: 2, PlazoPago.TRIMESTRAL: 3, PlazoPago.CUATRIMESTRAL: 4, PlazoPago.SEMESTRAL: 6, PlazoPago.ANUAL: 12}
        meses_por_cuota = periodos.get(arrendamiento.plazo_pago, 1)

        base_retencion = minimo_imponible * meses_por_cuota
        monto_retencion = (pago.monto_a_pagar - Decimal(base_retencion)) * Decimal('0.06')

        return Retencion(
            fecha_retencion=fecha or date.today(),
            monto_imponible=minimo_imponible,
            total_retencion=max(monto_retencion, Decimal(0)), # Asegurar que no sea negativo
            arrendador_id=arrendador_id
        )
    
    @staticmethod
    def obtener_por_factura_id(db: Session, facturacion_id: int):
        """
        Obtiene la retención asociada a un ID de facturación.

        Args:
            db (Session): La sesión de la base de datos.
            facturacion_id (int): El ID de la facturación.

        Returns:
            Retencion | None: La retención encontrada o None.
        """
        return db.query(Retencion).filter(Retencion.facturacion_id == facturacion_id).first()
