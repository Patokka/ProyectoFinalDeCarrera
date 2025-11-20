from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Arrendador import Arrendador
from dtos.ArrendadorDto import ArrendadorDto, ArrendadorDtoModificacion

class ArrendadorService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de arrendadores.
    """

    @staticmethod
    def listar_todos(db: Session):
        """
        Obtiene todos los arrendadores de la base de datos, ordenados por nombre.
        Args:
            db (Session): La sesión de la base de datos.
        Returns:
            list[Arrendador]: Una lista de todos los arrendadores.
        """
        return db.query(Arrendador).order_by(Arrendador.nombre_o_razon_social).all()

    @staticmethod
    def obtener_por_id(db: Session, arrendador_id: int):
        """
        Obtiene un arrendador por su ID.
        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador a buscar.
        Returns:
            Arrendador: El arrendador encontrado.
        Raises:
            HTTPException: Si el arrendador no se encuentra (código 404).
        """
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")
        return arrendador

    @staticmethod
    def crear(db: Session, dto: ArrendadorDto):
        """
        Crea un nuevo arrendador en la base de datos.
        Args:
            db (Session): La sesión de la base de datos.
            dto (ArrendadorDto): Los datos del arrendador a crear.
        Returns:
            Arrendador: El arrendador recién creado.
        Raises:
            HTTPException: Si el CUIL ya está registrado (código 400).
        """
        existente = db.query(Arrendador).filter(Arrendador.cuil == dto.cuil).first()
        if existente:
            raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")
        nuevo = Arrendador(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, arrendador_id: int, dto: ArrendadorDtoModificacion):
        """
        Actualiza los datos de un arrendador existente.
        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador a actualizar.
            dto (ArrendadorDtoModificacion): Los datos a modificar.
        Returns:
            Arrendador: El arrendador actualizado.
        Raises:
            HTTPException: Si el arrendador no se encuentra (404) o si el nombre o CUIL
                        ya están en uso por otro arrendador (400).
        """
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")

        datos = dto.model_dump(exclude_unset=True)

        if "nombre_o_razon_social" in datos:
            existe_nombre = (db.query(Arrendador).filter(Arrendador.nombre_o_razon_social == datos["nombre_o_razon_social"],Arrendador.id != arrendador_id).first())
            if existe_nombre:
                raise HTTPException(status_code=400, detail="El nombre ya está registrado para otro arrendador")

        if "cuil" in datos:
            existe_cuil = (db.query(Arrendador).filter(Arrendador.cuil == datos["cuil"], Arrendador.id != arrendador_id).first())
            if existe_cuil:
                raise HTTPException(status_code=400, detail="El CUIT - CUIL ya está registrado para otro arrendador")

        for campo, valor in datos.items():
            setattr(arrendador, campo, valor)

        db.commit()
        db.refresh(arrendador)
        return arrendador

    @staticmethod
    def eliminar(db: Session, arrendador_id: int):
        """
        Elimina un arrendador de la base de datos.
        Args:
            db (Session): La sesión de la base de datos.
            arrendador_id (int): El ID del arrendador a eliminar.
        Raises:
            HTTPException: Si el arrendador no se encuentra (404) o si tiene
                        relaciones existentes que impiden su eliminación.
        """
        arrendador = db.query(Arrendador).get(arrendador_id)
        if not arrendador:
            raise HTTPException(status_code=404, detail="Arrendador no encontrado.")
        
        verificar_relaciones_existentes(arrendador)
        
        db.delete(arrendador)
        db.commit()
