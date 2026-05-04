from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, nombre=user.nombre, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/categorias", response_model=List[schemas.CategoriaResponse])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).all()

@app.get("/marcas", response_model=List[schemas.MarcaResponse])
def get_marcas(db: Session = Depends(get_db)):
    return db.query(models.Marca).all()

@app.post("/transacciones", response_model=schemas.TransaccionResponse)
def create_transaccion(transaccion: schemas.TransaccionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_transaccion = models.Transaccion(**transaccion.model_dump(exclude_unset=True), usuario_id=current_user.id)
    db.add(db_transaccion)
    db.commit()
    db.refresh(db_transaccion)
    return db_transaccion

@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).all()

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.nombre = user_update.nombre
    db_user.email = user_update.email
    if user_update.password:
        db_user.password_hash = auth.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"detail": "User deleted"}

@app.get("/transacciones", response_model=List[schemas.TransaccionResponse])
def get_transacciones(
    usuario_id: int = None, 
    mes: int = None, 
    anio: int = None,
    skip: int = 0, 
    limit: int = 1000, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    from sqlalchemy import extract
    query = db.query(models.Transaccion)
    if usuario_id is not None:
        query = query.filter(models.Transaccion.usuario_id == usuario_id)
    if mes is not None:
        query = query.filter(extract('month', models.Transaccion.fecha) == mes)
    if anio is not None:
        query = query.filter(extract('year', models.Transaccion.fecha) == anio)
        
    query = query.order_by(models.Transaccion.fecha.desc())
    transacciones = query.offset(skip).limit(limit).all()
    return transacciones

@app.put("/transacciones/{tx_id}", response_model=schemas.TransaccionResponse)
def update_transaccion(tx_id: int, transaccion: schemas.TransaccionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_transaccion = db.query(models.Transaccion).filter(models.Transaccion.id == tx_id).first()
    if not db_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    if current_user.rol != "admin" and db_transaccion.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta transacción")
        
    update_data = transaccion.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaccion, key, value)
        
    db.commit()
    db.refresh(db_transaccion)
    return db_transaccion

@app.delete("/transacciones/{tx_id}")
def delete_transaccion(tx_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_transaccion = db.query(models.Transaccion).filter(models.Transaccion.id == tx_id).first()
    if not db_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
    if current_user.rol != "admin" and db_transaccion.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta transacción")
        
    db.delete(db_transaccion)
    db.commit()
    return {"detail": "Transacción eliminada"}
