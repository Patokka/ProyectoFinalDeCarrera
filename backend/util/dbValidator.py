from typing import Optional
from fastapi import HTTPException
from requests import Session
from sqlalchemy import and_, select, inspect
from sqlalchemy.orm import  object_session, with_parent



def verificar_relaciones_existentes(
    instance,
    db: Optional[Session] = None,
    exclude: Optional[list[str]] = None
) -> bool:
    """
    Verifica si la entidad tiene relaciones existentes que dependan de esta entidad
    (One-to-Many, Many-to-Many y One-to-One donde el otro lado depende de esta).
    Lanza HTTPException(400) si detecta al menos un relacionado.
    """
    exclude_keys = set(exclude or [])

    # Aseguramos tener una sesión y que los cambios estén visibles
    session = db or object_session(instance)
    if session is None:
        raise RuntimeError("No hay Session asociada al objeto ni se pasó 'db'.")

    # Muy importante: para ver asociaciones recién agregadas en la misma transacción
    session.flush()

    insp = inspect(instance)
    if insp.identity is None:
        # La instancia no está persistida (no tiene PK asignada),
        # no podemos verificar relaciones de forma fiable.
        raise HTTPException(
            status_code=400,
            detail="La entidad no está persistida; no se pueden verificar relaciones antes de eliminar."
        )

    parent_cls = insp.mapper.class_
    pk_cols = insp.mapper.primary_key       # columnas PK del parent
    pk_vals = insp.identity                 # valores PK (tupla)
    pk_filter = and_(*[c == v for c, v in zip(pk_cols, pk_vals)])

    for rel in insp.mapper.relationships:
        # Ignorar exclusiones explícitas o relaciones de solo lectura
        if rel.key in exclude_keys or rel.viewonly:
            continue

        # Si esta relación es MANYTOONE, esta entidad es el "hijo"; no bloquea su borrado.
        # (El borrado del hijo no debería frenarse porque tenga un padre.)
        if rel.direction.name == "MANYTOONE":
            continue

        # Tomamos el comparator del relationship desde la clase del parent
        rel_comp = getattr(parent_cls, rel.key)

        # Para colecciones (One-to-Many, Many-to-Many) usamos .any()
        # Para escalar (One-to-One desde el lado propietario) usamos .has()
        cond_rel = rel_comp.any() if rel.uselist else rel_comp.has()

        # Preguntamos si existe al menos 1 relacionado
        stmt = (
            select(1)
            .select_from(parent_cls)
            .where(pk_filter, cond_rel)
            .limit(1)
        )

        if session.execute(stmt).first() is not None:
            # ej: 'pagos' en tu caso de Precio.pagos (M2M)
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar porque tiene {rel.key} asociados."
            )

    return True

