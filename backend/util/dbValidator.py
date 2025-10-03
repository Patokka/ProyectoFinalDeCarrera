from fastapi import HTTPException
from sqlalchemy.orm import class_mapper
from sqlalchemy.orm.collections import InstrumentedList

def verificar_relaciones_existentes(instance, exclude: list[str] = None):
    exclude = exclude or []
    mapper = class_mapper(type(instance))

    for rel in mapper.relationships:
        if rel.key in exclude or rel.back_populates is None:
            continue

        # Obtenemos el valor de la relación
        related_value = getattr(instance, rel.key, None)

        # Si es lista (relación one-to-many / many-to-many)
        if isinstance(related_value, (list, InstrumentedList)) and len(related_value) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar porque tiene {rel.key} asociados."
            )

        # Si es relación one-to-one o many-to-one
        elif related_value is not None:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar porque tiene un {rel.key} asociado."
            )

    # Si no hay relaciones, se permite eliminar
    return True