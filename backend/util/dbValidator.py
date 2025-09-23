from fastapi import HTTPException
from sqlalchemy.orm import class_mapper

def verificar_relaciones_existentes(instance, exclude: list[str] = None):
    exclude = exclude or []
    mapper = class_mapper(type(instance))

    for rel in mapper.relationships:
        if rel.key in exclude or rel.back_populates is None:
            continue

        related_value = getattr(instance, rel.key)

        if isinstance(related_value, list) and related_value:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar porque tiene {rel.key} asociados."
            )
        elif related_value is not None:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar porque tiene un {rel.key} asociado."
            )