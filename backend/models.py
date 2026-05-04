from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transacciones = relationship("Transaccion", back_populates="usuario")

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)

    marcas = relationship("Marca", back_populates="categoria")
    transacciones = relationship("Transaccion", back_populates="categoria")

class Marca(Base):
    __tablename__ = "marcas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

    categoria = relationship("Categoria", back_populates="marcas")
    transacciones = relationship("Transaccion", back_populates="marca")

class Transaccion(Base):
    __tablename__ = "transacciones"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)
    transaccion = Column(String)
    cuotas = Column(Integer, nullable=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    marca_id = Column(Integer, ForeignKey("marcas.id"))
    monto = Column(Float)
    observaciones = Column(String, nullable=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    categoria = relationship("Categoria", back_populates="transacciones")
    marca = relationship("Marca", back_populates="transacciones")
    usuario = relationship("User", back_populates="transacciones")
