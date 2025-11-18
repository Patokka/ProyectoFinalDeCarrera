from util.dbValidator import verificar_relaciones_existentes
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.Localidad import Localidad
from model.Provincia import Provincia
from dtos.LocalidadDto import LocalidadDto, LocalidadDtoModificacion
from dtos.ProvinciaDto import ProvinciaDto, ProvinciaDtoModificacion

class UbicacionService:
    """
    Clase de servicio que encapsula la lógica de negocio para la gestión de
    provincias y localidades.
    """
    ##############################
    #OPERACIONES PARA LOCALIDADES#
    ##############################
    @staticmethod
    def listar_localidades(db: Session):
        """
        Obtiene todas las localidades de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Localidad]: Una lista de todas las localidades.
        """
        return db.query(Localidad).all()

    @staticmethod
    def obtener_localidad_por_id(db: Session, localidad_id: int):
        """
        Obtiene una localidad por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            localidad_id (int): El ID de la localidad a buscar.

        Returns:
            Localidad: La localidad encontrada.

        Raises:
            HTTPException: Si la localidad no se encuentra (código 404).
        """
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        return obj

    @staticmethod
    def crear_localidad(db: Session, dto: LocalidadDto):
        """
        Crea una nueva localidad en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (LocalidadDto): Los datos de la localidad a crear.

        Returns:
            Localidad: La localidad recién creada.
        """
        nuevo = Localidad(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_localidad(db: Session, localidad_id: int, dto: LocalidadDtoModificacion):
        """
        Actualiza los datos de una localidad existente.

        Args:
            db (Session): La sesión de la base de datos.
            localidad_id (int): El ID de la localidad a actualizar.
            dto (LocalidadDtoModificacion): Los datos a modificar.

        Returns:
            Localidad: La localidad actualizada.

        Raises:
            HTTPException: Si la localidad no se encuentra (código 404).
        """
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_localidad(db: Session, localidad_id: int):
        """
        Elimina una localidad de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            localidad_id (int): El ID de la localidad a eliminar.

        Raises:
            HTTPException: Si la localidad no se encuentra (404) o tiene
                           relaciones que impiden su eliminación.
        """
        obj = db.query(Localidad).get(localidad_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Localidad no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    #############################
    #OPERACIONES PARA PROVINCIAS#
    #############################
    @staticmethod
    def listar_provincias(db: Session):
        """
        Obtiene todas las provincias de la base de datos, ordenadas por nombre.

        Args:
            db (Session): La sesión de la base de datos.

        Returns:
            list[Provincia]: Una lista de todas las provincias.
        """
        return db.query(Provincia).order_by(Provincia.nombre_provincia).all()

    @staticmethod
    def obtener_provincia_por_id(db: Session, provincia_id: int):
        """
        Obtiene una provincia por su ID.

        Args:
            db (Session): La sesión de la base de datos.
            provincia_id (int): El ID de la provincia a buscar.

        Returns:
            Provincia: La provincia encontrada.

        Raises:
            HTTPException: Si la provincia no se encuentra (código 404).
        """
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        return obj

    @staticmethod
    def crear_provincia(db: Session, dto: ProvinciaDto):
        """
        Crea una nueva provincia en la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            dto (ProvinciaDto): Los datos de la provincia a crear.

        Returns:
            Provincia: La provincia recién creada.
        """
        nuevo = Provincia(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar_provincia(db: Session, provincia_id: int, dto: ProvinciaDtoModificacion):
        """
        Actualiza los datos de una provincia existente.

        Args:
            db (Session): La sesión de la base de datos.
            provincia_id (int): El ID de la provincia a actualizar.
            dto (ProvinciaDtoModificacion): Los datos a modificar.

        Returns:
            Provincia: La provincia actualizada.

        Raises:
            HTTPException: Si la provincia no se encuentra (código 404).
        """
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar_provincia(db: Session, provincia_id: int):
        """
        Elimina una provincia de la base de datos.

        Args:
            db (Session): La sesión de la base de datos.
            provincia_id (int): El ID de la provincia a eliminar.

        Raises:
            HTTPException: Si la provincia no se encuentra (404) o tiene
                           relaciones que impiden su eliminación.
        """
        obj = db.query(Provincia).get(provincia_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Provincia no encontrada.")
        verificar_relaciones_existentes(obj)
        db.delete(obj)
        db.commit()
        
    @staticmethod
    def obtener_localidades_provincia(db:Session, provincia_id: int):
        """
        Obtiene todas las localidades asociadas a una provincia.

        Args:
            db (Session): La sesión de la base de datos.
            provincia_id (int): El ID de la provincia.

        Returns:
            list[Localidad]: Lista de localidades de la provincia.
        """
        localidades = db.query(Localidad).filter(Localidad.provincia_id == provincia_id).order_by(Localidad.nombre_localidad).all()
        return localidades
