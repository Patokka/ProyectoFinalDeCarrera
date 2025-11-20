from sqlalchemy import Table, Column, ForeignKey
from util.database import Base
from sqlalchemy.orm import registry

# Tabla de asociación para la relación Many-to-Many entre Pago y Precio
# Documentación: Tabla intermedia que vincula los pagos con los precios utilizados para su cálculo.
pago_precio_association = Table(
    "pago_precio",
    Base.metadata,
    Column("pago_id", ForeignKey("pago.id"), primary_key=True, doc="Identificador del pago"),
    Column("precio_id", ForeignKey("precio.id"), primary_key=True, doc="Identificador del precio")
    )