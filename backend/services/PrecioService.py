from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import desc
from fastapi.responses import JSONResponse
import os, requests
import re
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.orm import Session
from enums.TipoOrigenPrecio import TipoOrigenPrecio
from model.Precio import Precio
from model.pago_precio_association import pago_precio_association
from dtos.PrecioDto import PrecioDto, PrecioDtoModificacion

load_dotenv()

class PrecioService:
    """
    Clase de servicio que encapsula la lógica para la gestión de precios,
    incluyendo operaciones CRUD y la obtención de precios desde APIs externas (BCR y AGD).
    """
    BCR_API_URL = os.getenv("CONSULTA_BCR")
    BCR_KEY = os.getenv("KEY_API_BCR")
    BCR_SECRET = os.getenv("SECRET_API_BCR")
    BCR_LOGIN = os.getenv("LOGIN_BCR")
    
    @staticmethod
    def listar_precios(db: Session):
        """
        Obtiene todos los precios de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Precio]: Una lista de todos los precios.
        """
        return db.query(Precio).all()
    
    @staticmethod
    def listar_precios_agd(db: Session):
        """
        Obtiene todos los precios de AGD, ordenados por fecha descendente.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Precio]: Lista de precios de AGD.
        """
        return db.query(Precio).filter(Precio.origen == TipoOrigenPrecio.AGD).order_by(desc(Precio.fecha_precio)).all()
    
    @staticmethod
    def listar_precios_bcr(db: Session):
        """
        Obtiene todos los precios de BCR, ordenados por fecha descendente.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Precio]: Lista de precios de BCR.
        """
        return db.query(Precio).filter(Precio.origen == TipoOrigenPrecio.BCR).order_by(desc(Precio.fecha_precio)).all()

    @staticmethod
    def obtener_precio_por_id(db: Session, precio_id: int):
        """
        Obtiene un precio por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            precio_id (int): El ID del precio a buscar.

        Returns:
            Precio: El precio encontrado.

        Raises:
            HTTPException: Si el precio no se encuentra (código 404).
        """
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        return obj

    @staticmethod
    def obtener_precios_pago(db, pago_id):
        """
        Obtiene la lista de precios que se utilizaron para calcular un pago específico.

        Args:
            db (Session): La sesión de la base de datos.
            pago_id (int): El ID del pago.

        Returns:
            list[Precio]: Lista de precios asociados al pago.
        """
        precios = db.query(Precio).join(pago_precio_association, Precio.id == pago_precio_association.c.precio_id).filter(pago_precio_association.c.pago_id == pago_id).order_by(Precio.fecha_precio).all()
        return precios
    
    @staticmethod
    def crear_precio(db: Session, dto: PrecioDto):
        """
        Crea un nuevo precio en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (PrecioDto): Los datos del precio a crear.

        Returns:
            Precio: El precio recién creado.

        Raises:
            HTTPException: Si ya existe un precio para la misma fecha y origen (400).
        """
        existente = db.query(Precio).filter(Precio.fecha_precio == dto.fecha_precio, Precio.origen == dto.origen).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"Ya existe un precio para {dto.origen} en {dto.fecha_precio}.")
        nuevo = Precio(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_precio(db: Session, precio_id: int, dto: PrecioDtoModificacion):
        """
        Actualiza un precio existente.

        Args:
            db (Session): La sesión de la base de datos.
            precio_id (int): El ID del precio a actualizar.
            dto (PrecioDtoModificacion): Los datos a modificar.

        Returns:
            Precio: El precio actualizado.

        Raises:
            HTTPException: Si no se encuentra el precio (404) o si la nueva fecha y origen
                           entran en conflicto con otro precio existente (400).
        """
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        
        if dto.fecha_precio and dto.origen:
            existente = db.query(Precio).filter(
                Precio.fecha_precio == dto.fecha_precio, Precio.origen == dto.origen, Precio.id != precio_id
            ).first()
            if existente:
                raise HTTPException(status_code=400, detail=f"Ya existe un precio para {dto.origen} en {dto.fecha_precio}.")
        
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_precio(db: Session, precio_id: int):
        """
        Elimina un precio de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            precio_id (int): El ID del precio a eliminar.

        Raises:
            HTTPException: Si el precio no se encuentra (404) o si está asociado a un pago (400).
        """
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        if db.query(pago_precio_association).filter(pago_precio_association.c.precio_id == precio_id).count() > 0:
            raise HTTPException(status_code=400, detail="No se puede eliminar el precio porque tiene pagos asociados.")

        db.delete(obj)
        db.commit()
        
    @staticmethod
    def _obtener_dia_habil_anterior():
        """
        Calcula la fecha del último día hábil (lunes a viernes).

        Returns:
            date: La fecha del día hábil anterior.
        """
        hoy = date.today()
        offset = {0: 3, 6: 2, 5: 1}.get(hoy.weekday(), 1)
        return hoy - timedelta(days=offset)

    @staticmethod
    def _login_bcr():
        """
        Se autentica contra la API de BCR para obtener un token de acceso.

        Returns:
            str: El token de autenticación.
        """
        headers = {"api_key": PrecioService.BCR_KEY, "secret": PrecioService.BCR_SECRET}
        r = requests.post(PrecioService.BCR_LOGIN, headers=headers, timeout=10)
        r.raise_for_status()
        return r.json()["data"]["token"]

    @staticmethod
    def obtener_precio_bcr_dia_anterior():
        """
        Obtiene el precio de la soja del último día hábil desde la API de BCR.

        Returns:
            tuple[date, float]: La fecha del precio y su valor.
        """
        token = PrecioService._login_bcr()
        fecha_consulta = PrecioService._obtener_dia_habil_anterior()
        params = {"idGrano": 21, "fechaConcertacionDesde": fecha_consulta, "fechaConcertacionHasta": fecha_consulta}
        headers = {"Authorization": token}
        r = requests.get(PrecioService.BCR_API_URL, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        data = r.json().get("data", [])
        if not data or "precio_Cotizacion" not in data[0]:
            raise ValueError(f"No se encontró precio BCR para {fecha_consulta}.")
        return fecha_consulta, data[0]["precio_Cotizacion"]

    @staticmethod
    def actualizar_precio_bcr(db: Session):
        """
        Job que obtiene el precio de BCR y lo guarda en la base de datos si no existe.
        """
        try:
            fecha_precio, valor = PrecioService.obtener_precio_bcr_dia_anterior()
            existe = db.query(Precio).filter(Precio.origen == TipoOrigenPrecio.BCR, Precio.fecha_precio == fecha_precio).first()
            if existe:
                print(f"Precio BCR ya cargado para {fecha_precio}.")
                return

            nuevo_precio = Precio(fecha_precio=fecha_precio, precio_obtenido=valor, origen=TipoOrigenPrecio.BCR)
            db.add(nuevo_precio)
            db.commit()
            print(f"✅ Precio BCR agregado: {valor} ({fecha_precio}).")
        except Exception as e:
            print(f"Error al actualizar precio BCR: {e}")

    @staticmethod
    def actualizar_precio_agd(db: Session , payload: dict):
        """
        Procesa un payload (generalmente de un bot) para extraer y guardar el precio de la soja de AGD.

        Args:
            db (Session): La sesión de la base de datos.
            payload (dict): El payload que contiene el mensaje de texto.

        Returns:
            JSONResponse: Una respuesta HTTP indicando el resultado.
        """
        mensaje = payload.get("mensaje", "")
        match = re.search(r"Soja.*?\$([\d\.]+)", mensaje)
        if not match:
            return JSONResponse(status_code=404, content={"status": "no encontrado"})

        valor = float(match.group(1).replace(".", ""))
        hoy = date.today()
        existe = db.query(Precio).filter(Precio.origen == TipoOrigenPrecio.AGD, Precio.fecha_precio == hoy).first()
        if existe:
            return JSONResponse(status_code=409, content={"status": "ya existe", "valor": str(existe.precio_obtenido)})

        precio = Precio(fecha_precio=hoy, precio_obtenido=Decimal(str(valor)), origen=TipoOrigenPrecio.AGD)
        db.add(precio)
        db.commit()
        return JSONResponse(status_code=201, content={"status": "ok", "valor": valor})
