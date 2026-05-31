from database import SessionLocal, engine, Base
import models
from routers.auth import get_password_hash

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_email = "admin@warung.com"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if admin:
            print("Admin user already exists.")
            return

        # Create new admin user
        hashed_pw = get_password_hash("admin")
        new_user = models.User(
            email=admin_email,
            hashed_password=hashed_pw,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create a store for the admin
        new_store = models.Store(
            name="Warung Utama",
            owner_id=new_user.id
        )
        db.add(new_store)
        db.commit()
        
        print("Successfully seeded default admin!")
        print(f"Email: {admin_email}")
        print("Password: admin")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
