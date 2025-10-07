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

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Retencion).order_by(asc(Retencion.fecha_retencion)).all()

    @staticmethod
    def obtener_por_id(db: Session, retencion_id: int):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, dto: RetencionDto):
        #Esta linea verifica si existe el arrendador
        arrendador = ArrendadorService.obtener_por_id(db, dto.arrendador_id)
        
        if arrendador.condicion_fiscal == TipoCondicion.MONOTRIBUTISTA:
            raise HTTPException(status_code=400, detail="La condición fiscal del arrendador obliga a no aplicarle retenciones.")

        nuevo = Retencion(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, retencion_id: int, dto: RetencionDtoModificacion):
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
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_retenciones_arrendador(db: Session, arrendador_id: int):
        #Solamente se consulta el arrendador para obtener la excepción en caso de que no exista        
        ArrendadorService.obtener_por_id(db,arrendador_id)
        
        retenciones = db.query(Retencion).filter(
            Retencion.arrendador_id == arrendador_id
        ).all()
        return retenciones
    
    @staticmethod
    def obtener_configuracion(db: Session, clave: str) -> str | None:
        config = db.query(Configuracion).filter_by(clave=clave).first()
        return config.valor if config else HTTPException(status_code=404, detail= f"No se encontró la configuración de {clave}")

    @staticmethod
    def actualizar_configuracion(db: Session, clave: str, valor: str) -> dict:
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
        config = db.query(Configuracion).filter_by(clave=clave).first()
        if not config:
            raise HTTPException(status_code=404, detail=f"No se encontró la configuración de {clave}")
        db.delete(config)
        db.commit()
        return {"status": "ok", "clave": clave}
    
    @staticmethod
    def crear_para_factura(db: Session, arrendador_id: int, pago, fecha: date):
        """
        Crea una retención en base al pago y la fecha dada.
        Retorna la instancia de Retencion ya persistida en la DB.
        """
        arrendamiento = ArrendamientoService.obtener_por_id(db, pago.arrendamiento_id)
        #Obtener monto imponible actual desde la config
        monto_imponible_actual = float(RetencionService.obtener_configuracion(db, "MONTO_IMPONIBLE"))

        periodos = {
            PlazoPago.MENSUAL: 1,
            PlazoPago.BIMESTRAL: 2,
            PlazoPago.TRIMESTRAL: 3,
            PlazoPago.CUATRIMESTRAL: 4,
            PlazoPago.SEMESTRAL: 6,
            PlazoPago.ANUAL: 12
        }
        meses_por_cuota = periodos.get(arrendamiento.plazo_pago)

        #Calcular base de la retención
        base_retencion = monto_imponible_actual * meses_por_cuota

        monto_retencion = (pago.monto_a_pagar -Decimal(base_retencion))* Decimal(0.06)

        #Crear objeto retención
        retencion = Retencion(
            fecha_retencion=fecha or date.today(),
            monto_imponible=monto_imponible_actual,
            total_retencion=monto_retencion,
            arrendador_id=arrendador_id,
            facturacion_id=None
        )
        db.add(retencion)
        db.flush()

        return retencion
    
    @staticmethod
    def obtener_por_factura_id(db: Session, facturacion_id: int):
        obj = db.query(Retencion).filter(Retencion.facturacion_id == facturacion_id).first()
        return obj 