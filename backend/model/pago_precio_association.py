from sqlalchemy import Table, Column, ForeignKey
from backend.util.database import Base

pago_precio_association = Table(
    "pago_precio",
    Base.metadata,
    Column("pago_id", ForeignKey("pago.id"), primary_key=True),
    Column("precio_id", ForeignKey("precio.id"), primary_key=True)
)