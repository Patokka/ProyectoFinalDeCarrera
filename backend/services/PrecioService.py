from datetime import date, timedelta
from fastapi.responses import JSONResponse
import os, requests
import re
from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enums.TipoOrigenPrecio import TipoOrigenPrecio
from model.Precio import Precio
from dtos.PrecioDto import PrecioDto, PrecioDtoModificacion

# Cargar variables del .env
load_dotenv()

#Esta clase se encargará tanto de las operaciones de las entidades localidad como de provincia.
class PrecioService:
    BCR_API_URL = os.getenv("CONSULTA_BCR")
    BCR_KEY = os.getenv("KEY_API_BCR")
    BCR_SECRET = os.getenv("SECRET_API_BCR")
    BCR_LOGIN = os.getenv("LOGIN_BCR")
    
    ##############################
    ###OPERACIONES PARA PRECIOS###
    ##############################
    @staticmethod
    def listar_precios(db: Session):
        return db.query(Precio).all()

    @staticmethod
    def obtener_precio_por_id(db: Session, precio_id: int):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        return obj

    @staticmethod
    def crear_precio(db: Session, dto: PrecioDto):
        #Primero se ve si ya existe un precio para esa fecha y origen
        existente = db.query(Precio).filter(
            Precio.fecha_precio == dto.fecha_precio,
            Precio.origen == dto.origen
        ).first()

        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un precio registrado para el origen '{dto.origen}' en la fecha '{dto.fecha_precio}'."
            )

        nuevo = Precio(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_precio(db: Session, precio_id: int, dto: PrecioDtoModificacion):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_precio(db: Session, precio_id: int):
        obj = db.query(Precio).get(precio_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Precio no encontrado.")
        db.delete(obj)
        db.commit()
        
        
    @staticmethod
    def _obtener_dia_habil_anterior():
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
        mensaje = payload.get("mensaje", "")

        # Buscar valor de soja en el mensaje
        match = re.search(r"Soja.*?\$([\d\.]+)", mensaje)
        if not match:
            return JSONResponse(
                status_code=404,
                content={"status": "no encontrado", "mensaje": "No se encontró precio de soja en el texto."}
            )

        valor = float(match.group(1).replace(".", ""))

        # Evitar duplicados
        hoy = date.today()
        existe = db.query(Precio).filter(
            Precio.origen == TipoOrigenPrecio.AGD,
            Precio.fecha_precio == hoy
        ).first()

        if existe:
            return JSONResponse(
                status_code=409,  # Conflicto, ya existe
                content={"status": "ya existe", "valor": existe.precio_obtenido}
            )

        # Crear nuevo precio
        precio = Precio(
            fecha_precio=hoy,
            precio_obtenido=valor,
            origen=TipoOrigenPrecio.AGD
        )
        db.add(precio)
        db.commit()

        return JSONResponse(
            status_code=201,  # Creado
            content={"status": "ok", "valor": valor}
        )