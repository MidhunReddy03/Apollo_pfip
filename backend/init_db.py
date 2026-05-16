"""
Initialize database and create default admin user
"""
import asyncio
import sys
from app.db.session import engine, Base, AsyncSessionLocal
from app.models import User, UserRole
from app.core.security import get_password_hash


async def init_db():
    """Create all tables"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Database tables created successfully!")


async def create_admin_user():
    """Create default admin user"""
    print("\nCreating admin user...")
    
    async with AsyncSessionLocal() as db:
        try:
            admin = User(
                email="admin@apollodqms.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                phone="+1234567890",
                role=UserRole.SUPER_ADMIN,
                tenant_id="default",
            )
            
            db.add(admin)
            await db.commit()
            
            print("✓ Admin user created successfully!")
            print("\n" + "="*50)
            print("Login Credentials:")
            print("="*50)
            print("Username: admin")
            print("Password: admin123")
            print("Email: admin@apollodqms.com")
            print("="*50)
            print("\n⚠️  Please change the password after first login!")
            
        except Exception as e:
            print(f"✗ Error creating admin user: {e}")
            await db.rollback()


async def main():
    """Main initialization function"""
    print("="*50)
    print("Apollo DQMS 2.0 - Database Initialization")
    print("="*50)
    
    try:
        await init_db()
        await create_admin_user()
        print("\n✓ Initialization completed successfully!")
        return 0
    except Exception as e:
        print(f"\n✗ Initialization failed: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
