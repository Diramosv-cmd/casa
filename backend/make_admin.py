import sys
from database import SessionLocal
import models

def make_admin(email):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"Usuario con email {email} no encontrado.")
            return
        user.rol = "admin"
        db.commit()
        print(f"¡Usuario {email} ahora es administrador!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python make_admin.py tu@email.com")
    else:
        make_admin(sys.argv[1])
