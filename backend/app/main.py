from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, patients, encounters, stations, queues, workflows, patient_portal
from app.api import triage, queue_forecast, gates, audit, websocket
from app.db.session import engine, Base, AsyncSessionLocal
from app.models import User, UserRole
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="AI-Powered Hospital Operations Intelligence Platform",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Create tables and seed admin user on startup"""
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✓ Database tables ready")

    # Seed admin user if not exists
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()
        if not admin:
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

            # Also seed a receptionist
            receptionist = User(
                email="receptionist@apollodqms.com",
                username="receptionist",
                hashed_password=get_password_hash("rec123"),
                full_name="Sarah Wilson",
                phone="+1234567891",
                role=UserRole.RECEPTIONIST,
                tenant_id="default",
            )
            db.add(receptionist)

            # Seed a doctor
            doctor = User(
                email="doctor@apollodqms.com",
                username="doctor",
                hashed_password=get_password_hash("doc123"),
                full_name="Dr. Sharma",
                phone="+1234567892",
                role=UserRole.DOCTOR,
                tenant_id="default",
            )
            db.add(doctor)

            # Seed a floor manager
            manager = User(
                email="manager@apollodqms.com",
                username="manager",
                hashed_password=get_password_hash("mgr123"),
                full_name="Floor Manager Patel",
                phone="+1234567893",
                role=UserRole.FLOOR_MANAGER,
                tenant_id="default",
            )
            db.add(manager)

            # Seed a technician
            tech = User(
                email="tech@apollodqms.com",
                username="technician",
                hashed_password=get_password_hash("tech123"),
                full_name="Tech Ravi Kumar",
                phone="+1234567894",
                role=UserRole.TECHNICIAN,
                tenant_id="default",
            )
            db.add(tech)

            await db.commit()
            logger.info("✓ Seed users created (admin/receptionist/doctor/manager/technician)")
        else:
            logger.info("✓ Admin user already exists, skipping seed")


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(patients.router, prefix=settings.API_V1_PREFIX)
app.include_router(encounters.router, prefix=settings.API_V1_PREFIX)
app.include_router(stations.router, prefix=settings.API_V1_PREFIX)
app.include_router(queues.router, prefix=settings.API_V1_PREFIX)
app.include_router(workflows.router, prefix=settings.API_V1_PREFIX)
app.include_router(patient_portal.router, prefix=settings.API_V1_PREFIX)

# PFIP 4.0 Feature Routers
app.include_router(triage.router, prefix=settings.API_V1_PREFIX)
app.include_router(queue_forecast.router, prefix=settings.API_V1_PREFIX)
app.include_router(gates.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit.router, prefix=settings.API_V1_PREFIX)

# WebSocket router (no prefix for WebSocket routes)
app.include_router(websocket.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

