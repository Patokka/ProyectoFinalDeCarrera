from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Arrendatario import Arrendatario
from dtos.ArrendatarioDto import ArrendatarioDto, ArrendatarioDtoModificacion

class ArrendatarioService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de arrendatarios.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todos los arrendatarios de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Arrendatario]: Una lista de todos los arrendatarios.
        """
        return db.query(Arrendatario).all()

    @staticmethod
    def obtener_por_id(db: Session, arrendatario_id: int):
        """
        Obtiene un arrendatario por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            arrendatario_id (int): El ID del arrendatario a buscar.

        Returns:
            Arrendatario: El arrendatario encontrado.

        Raises:
            HTTPException: Si el arrendatario no se encuentra (código 404).
        """
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        return obj

    @staticmethod
    def crear(db: Session, dto: ArrendatarioDto):
        """
        Crea un nuevo arrendatario en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (ArrendatarioDto): Los datos del arrendatario a crear.

        Returns:
            Arrendatario: El arrendatario recién creado.

        Raises:
            HTTPException: Si el CUIT ya está registrado (código 400).
        """
        existente = db.query(Arrendatario).filter(Arrendatario.cuit == dto.cuit).first()
        if existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendatario")
        nuevo = Arrendatario(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendatario_id: int, dto: ArrendatarioDtoModificacion):
        """
        Actualiza los datos de un arrendatario existente.

        Args:
            db (Session): La sesión de la base de datos.
            arrendatario_id (int): El ID del arrendatario a actualizar.
            dto (ArrendatarioDtoModificacion): Los datos a modificar.

        Returns:
            Arrendatario: El arrendatario actualizado.

        Raises:
            HTTPException: Si el arrendatario no se encuentra (404) o si la razón social o CUIT
                           ya están en uso por otro arrendatario (400).
        """
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        
        datos = dto.model_dump(exclude_unset=True)
        
        if "razon_social" in datos:
            existe_nombre = (db.query(Arrendatario).filter(Arrendatario.razon_social == datos["razon_social"],Arrendatario.id != arrendatario_id).first())
            if existe_nombre:
                raise HTTPException(status_code=400, detail="El nombre ya está registrado para otro arrendatario")

        if "cuit" in datos:
            existe_cuit = (db.query(Arrendatario).filter(Arrendatario.cuit == datos["cuit"], Arrendatario.id != arrendatario_id).first())
            if existe_cuit:
                raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")

        for campo, valor in datos.items():
            setattr(obj, campo, valor)
        
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, arrendatario_id: int):
        """
        Elimina un arrendatario de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            arrendatario_id (int): El ID del arrendatario a eliminar.

        Raises:
            HTTPException: Si el arrendatario no se encuentra (404) o si tiene
                           relaciones existentes que impiden su eliminación.
        """
        obj = db.query(Arrendatario).get(arrendatario_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Arrendatario no encontrado.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
