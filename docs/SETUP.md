# Apollo DQMS 2.0 - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Redis 7+** - [Download](https://redis.io/download)
- **Docker & Docker Compose** (Optional) - [Download](https://www.docker.com/products/docker-desktop)

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Unix/MacOS
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
# Copy example env file
copy .env.example .env  # Windows
cp .env.example .env    # Unix/MacOS

# Edit .env and update:
# - SECRET_KEY (generate a secure random key)
# - DATABASE_URL (if not using Docker defaults)
# - REDIS_URL (if not using Docker defaults)
```

### 5. Initialize database
```bash
# Create database tables
alembic upgrade head
```

### 6. Run backend server
```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
# Copy example env file
copy .env.example .env  # Windows
cp .env.example .env    # Unix/MacOS
```

### 4. Run frontend development server
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## Creating Your First User

Since this is a fresh installation, you'll need to create an admin user manually:

### Option 1: Using Python Script

Create a file `create_admin.py` in the backend directory:

```python
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin = User(
            email="admin@apollodqms.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.SUPER_ADMIN,
            tenant_id="default",
        )
        db.add(admin)
        await db.commit()
        print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(create_admin())
```

Run it:
```bash
python create_admin.py
```

### Option 2: Using API

Use the registration endpoint via curl or Postman:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apollodqms.com",
    "username": "admin",
    "password": "admin123",
    "full_name": "System Administrator",
    "role": "super_admin",
    "tenant_id": "default"
  }'
```

## Login

1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. You'll be redirected to the dashboard

## Project Structure

```
apollo-dqms/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Custom middleware
│   │   └── main.py       # FastAPI app
│   ├── alembic/          # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   └── App.tsx
│   └── package.json
└── docker-compose.yml
```

## Next Steps

Now that your development environment is set up, you can:

1. **Explore the API** - Visit http://localhost:8000/docs for interactive API documentation
2. **Create Patients** - Add patient records through the API
3. **Set up Stations** - Configure equipment and stations
4. **Manage Queues** - Start orchestrating patient flow
5. **Customize** - Extend the platform with additional features

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env file
- Verify credentials match docker-compose.yml

### Redis Connection Issues
- Ensure Redis is running: `docker-compose ps`
- Check REDIS_URL in .env file

### Frontend Can't Connect to Backend
- Ensure backend is running on port 8000
- Check VITE_API_URL in frontend/.env
- Verify CORS settings in backend/app/core/config.py

### Port Already in Use
- Backend (8000): Change PORT in backend/.env
- Frontend (5173): Change port in frontend/vite.config.ts
- PostgreSQL (5432): Change port mapping in docker-compose.yml
- Redis (6379): Change port mapping in docker-compose.yml

## Development Tips

- **Hot Reload**: Both backend and frontend support hot reload during development
- **API Testing**: Use the built-in Swagger UI at http://localhost:8000/docs
- **Database Migrations**: After model changes, create migrations with `alembic revision --autogenerate -m "description"`
- **Code Quality**: Run `black .` for Python formatting, `npm run lint` for TypeScript

## Support

For issues or questions, refer to:
- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [User Manual](./docs/user-manual.md)
