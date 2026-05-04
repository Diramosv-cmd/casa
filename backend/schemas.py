from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    nombre: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    rol: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CategoriaBase(BaseModel):
    nombre: str

class CategoriaResponse(CategoriaBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True

class MarcaBase(BaseModel):
    nombre: str
    categoria_id: int

class MarcaResponse(MarcaBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True

class TransaccionBase(BaseModel):
    tipo: str
    transaccion: str
    cuotas: Optional[int] = None
    categoria_id: int
    marca_id: int
    monto: float
    observaciones: Optional[str] = None

class TransaccionCreate(TransaccionBase):
    fecha: Optional[datetime] = None

class TransaccionResponse(TransaccionBase):
    id: int
    fecha: datetime
    usuario_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
