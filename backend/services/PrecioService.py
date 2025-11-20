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

# Cargar variables del .env
load_dotenv()

#Esta clase se encargará tanto de las operaciones de las entidades localidad como de provincia.
class PrecioService:
    """
    Clase de servicio que encapsula la lógica para la gestión de precios,
    incluyendo operaciones CRUD y la obtención de precios desde APIs externas (BCR y AGD).
    """

    BCR_API_URL = os.getenv("CONSULTA_BCR")
    BCR_KEY = os.getenv("KEY_API_BCR")
    BCR_SECRET = os.getenv("SECRET_API_BCR")
    BCR_LOGIN = os.getenv("LOGIN_BCR")
    
    ##############################
    ###OPERACIONES PARA PRECIOS###
    ##############################
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
        existente = db.query(Precio).filter(
            Precio.fecha_precio == dto.fecha_precio,
            Precio.origen == dto.origen
        ).first()

        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un precio registrado para el origen '{dto.origen}' en la fecha {dto.fecha_precio.strftime('%d/%m/%Y')}."
            )

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
        
        existente = db.query(Precio).filter(
            Precio.fecha_precio == dto.fecha_precio,
            Precio.origen == dto.origen,
            Precio.id != precio_id
        ).first()

        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un precio registrado para el origen '{dto.origen}' en la fecha {dto.fecha_precio.strftime('%d/%m/%Y')}."
            )
        
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
        pagos_asociados = (
            db.query(pago_precio_association)
            .filter(pago_precio_association.c.precio_id == precio_id)
            .count()
        )

        if pagos_asociados > 0:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar el precio porque tiene pagos asociados."
            )

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
        if hoy.weekday() == 0:  # Lunes -> Viernes anterior
            return hoy - timedelta(days=3)
        elif hoy.weekday() in [6, 5]:  # Domingo o Sábado -> Viernes anterior
            dias_retroceso = hoy.weekday() - 4
            return hoy - timedelta(days=dias_retroceso)
        else:  # Martes a Viernes -> Día anterior
            return hoy - timedelta(days=1)

    @staticmethod
    def _login_bcr():
        """
        Se autentica contra la API de BCR para obtener un token de acceso.
        Returns:
            str: El token de autenticación.
        """
        headers = {
                "api_key": PrecioService.BCR_KEY,
                "secret": PrecioService.BCR_SECRET,
                "Content-Type": "application/json"
        }
        r = requests.post(PrecioService.BCR_LOGIN, headers=headers, timeout=10)

        if r.status_code != 200:
            raise Exception(f"Error login BCR: {r.status_code}, {r.text}")

        data = r.json()
        return data["data"]["token"]

    @staticmethod
    def obtener_precio_bcr_dia_anterior():
        """
        Obtiene el precio de la soja del último día hábil desde la API de BCR.
        Returns:
            tuple[date, float]: La fecha del precio y su valor.
        """
        token = PrecioService._login_bcr()
        fecha_consulta = PrecioService._obtener_dia_habil_anterior()
        fecha_str = fecha_consulta.strftime("%Y-%m-%d")

        params = {
            "idGrano": 21,
            "fechaConcertacionDesde": fecha_str,
            "fechaConcertacionHasta": fecha_str,
            "page": 1
        }
        headers = {"Authorization": token}

        r = requests.get(
            PrecioService.BCR_API_URL,
            headers=headers,
            params=params,
            timeout=15
        )

        if r.status_code != 200:
            raise ValueError(f"Error al consultar BCR: {r.status_code} - {r.text}.")

        response_json = r.json()
        data = response_json.get("data", [])

        if not data:
            raise ValueError(f"No se encontró precio BCR para {fecha_str}.")

        # Ajustar según el formato real de la respuesta
        precio = data[0].get("precio_Cotizacion")  # ejemplo de nombre de campo
        if precio is None:
            raise ValueError(f"No se encontró campo 'precio_Cotizacion' en respuesta BCR.")

        return fecha_consulta, precio

    @staticmethod
    def actualizar_precio_bcr(db: Session):
        """
        Job que obtiene el precio de BCR y lo guarda en la base de datos si no existe.
        """
        fecha_precio, valor = PrecioService.obtener_precio_bcr_dia_anterior()

        # Evitar duplicados
        existe = db.query(Precio).filter(
            Precio.origen == TipoOrigenPrecio.BCR,
            Precio.fecha_precio == fecha_precio
        ).first()

        if existe:
            print(f"Precio BCR ya cargado para {fecha_precio}.")
            return None

        nuevo_precio = Precio(
            fecha_precio=fecha_precio,
            precio_obtenido=valor,
            origen=TipoOrigenPrecio.BCR
        )
        db.add(nuevo_precio)
        db.commit()
        print(f"✅Precio BCR agregado: {valor} ({fecha_precio}).")

        return None

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

        # Buscar valor de soja en el mensaje
        match = re.search(r"Soja.*?\$([\d\.]+)", mensaje)
        if not match:
            return JSONResponse(
                status_code=404,
                content={"status": "no encontrado", "mensaje": "No se encontró precio de soja en el texto."}
            )

        valor = float(match.group(1).replace(".", ""))

        hoy = date.today()
        existe = db.query(Precio).filter(
            Precio.origen == TipoOrigenPrecio.AGD,
            Precio.fecha_precio == hoy
        ).first()

        if existe:
            return JSONResponse(
                status_code=409,  # Conflicto, ya existe
                content={"status": "ya existe", "valor": str(existe.precio_obtenido)}
            )

        precio = Precio(
            fecha_precio=hoy,
            precio_obtenido=Decimal(str(valor)),
            origen=TipoOrigenPrecio.AGD
        )
        db.add(precio)
        db.commit()

        return JSONResponse(
            status_code=201, 
            content={"status": "ok", "valor": valor}
        )