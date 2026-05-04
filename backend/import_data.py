import pandas as pd
from database import SessionLocal, engine
import models

def import_data():
    # Asegurar que las tablas existan
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        df = pd.read_excel('../CategoriaEmpresa.xlsx')
        
        # Iterar sobre las filas
        for index, row in df.iterrows():
            cat_name = str(row['Categoría']).strip()
            emp_name = str(row['Empresa']).strip()
            
            # Buscar o crear categoría
            categoria = db.query(models.Categoria).filter(models.Categoria.nombre == cat_name).first()
            if not categoria:
                categoria = models.Categoria(nombre=cat_name)
                db.add(categoria)
                db.commit()
                db.refresh(categoria)
            
            # Buscar o crear empresa (marca)
            marca = db.query(models.Marca).filter(
                models.Marca.nombre == emp_name, 
                models.Marca.categoria_id == categoria.id
            ).first()
            
            if not marca:
                marca = models.Marca(nombre=emp_name, categoria_id=categoria.id)
                db.add(marca)
                db.commit()
                
        print("Datos importados exitosamente!")
    except Exception as e:
        print(f"Error importando datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
