# Apollo DQMS 2.0 - Project Structure

## Directory Organization

```
apollo_dqms_final333/
├── backend/              # FastAPI Python backend
├── frontend/             # React TypeScript frontend
├── shared/               # Shared types and utilities
├── docs/                 # Documentation
├── scripts/              # Deployment and utility scripts
├── docker-compose.yml    # Container orchestration
└── README.md            # Project overview
```

## Backend Structure (`/backend/`)

### Core Application (`/backend/app/`)
```
app/
├── api/                  # API endpoints and routes
│   ├── __init__.py
│   └── auth.py          # Authentication endpoints (login, register, user info)
├── core/                 # Core configuration and utilities
│   ├── __init__.py
│   ├── config.py        # Application settings and environment variables
│   └── security.py      # JWT tokens, password hashing, security utilities
├── db/                   # Database configuration
│   ├── __init__.py
│   └── session.py       # SQLAlchemy session management and connection
├── middleware/           # Request/response middleware
│   ├── __init__.py
│   └── auth.py          # JWT authentication middleware
├── models/               # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── base.py          # Base model with tenant support
│   ├── user.py          # User model with authentication
│   ├── patient.py       # Patient demographics
│   ├── encounter.py     # Patient visits and encounters
│   ├── station.py       # Equipment and service stations
│   └── queue.py         # Queue management
├── schemas/              # Pydantic validation schemas
│   ├── __init__.py
│   ├── user.py          # User request/response schemas
│   ├── patient.py       # Patient schemas
│   ├── encounter.py     # Encounter schemas
│   ├── station.py       # Station schemas
│   └── queue.py         # Queue schemas
├── services/             # Business logic layer
│   └── __init__.py
├── utils/                # Utility functions
│   └── __init__.py
├── __init__.py
└── main.py              # FastAPI application entry point
```

### Configuration Files
- `requirements.txt` - Python dependencies
- `alembic.ini` - Database migration configuration
- `init_db.py` - Database initialization script
- `.env.example` - Environment variable template

## Frontend Structure (`/frontend/`)

### Source Code (`/frontend/src/`)
```
src/
├── components/           # Reusable React components
│   └── ui/              # UI component library
├── hooks/                # Custom React hooks
├── pages/                # Page components
│   ├── LoginPage.tsx    # Authentication page
│   └── DashboardPage.tsx # Main dashboard
├── services/             # API integration layer
│   ├── api.ts           # Axios HTTP client configuration
│   └── auth.ts          # Authentication service
├── store/                # State management
│   └── index.ts         # Zustand stores (auth, user)
├── types/                # TypeScript type definitions
│   └── index.ts         # Shared types
├── utils/                # Utility functions
├── App.tsx              # Main application with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles with Tailwind
```

### Configuration Files
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build tool configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env.example` - Environment variable template

## Documentation (`/docs/`)
- `ARCHITECTURE.md` - Detailed system architecture (2,500+ words)
- `ARCHITECTURE_DIAGRAM.md` - Visual architecture diagrams
- `ROADMAP.md` - Development roadmap and phases (3,000+ words)
- `SETUP.md` - Detailed setup instructions

## Core Components and Relationships

### Database Models (Multi-tenant)
All models inherit from `TenantBaseModel` for automatic tenant isolation:

1. **User** - Authentication and authorization
   - Relationships: Created patients, encounters
   - Fields: email, username, password_hash, role, tenant_id

2. **Patient** - Patient demographics
   - Relationships: Encounters, queues
   - Fields: mrn, name, contact info, demographics

3. **Encounter** - Patient visits
   - Relationships: Patient, user (created_by), queues
   - Fields: encounter_number, status, timestamps

4. **Station** - Service delivery points
   - Relationships: Queues
   - Fields: name, type, status, capacity

5. **Queue** - Queue management
   - Relationships: Patient, encounter, station
   - Fields: queue_number, priority, status, timestamps

### API Layer Architecture
```
Client Request
    ↓
FastAPI Router (auth.py)
    ↓
Pydantic Schema Validation
    ↓
Authentication Middleware (JWT)
    ↓
Business Logic (services/)
    ↓
SQLAlchemy ORM (models/)
    ↓
PostgreSQL Database
```

### Frontend State Flow
```
User Action
    ↓
React Component
    ↓
Zustand Store (state management)
    ↓
API Service (axios)
    ↓
Backend API
    ↓
Store Update
    ↓
Component Re-render
```

## Architectural Patterns

### Backend Patterns
- **Layered Architecture**: API → Services → Models → Database
- **Dependency Injection**: Settings and database sessions
- **Repository Pattern**: Database access abstraction
- **Multi-tenancy**: Tenant-aware base model with automatic filtering
- **JWT Authentication**: Stateless token-based auth with refresh tokens

### Frontend Patterns
- **Component-based Architecture**: Reusable React components
- **Centralized State Management**: Zustand for global state
- **Service Layer**: Abstracted API calls
- **Protected Routes**: Authentication-based routing
- **Type Safety**: TypeScript throughout

### Database Patterns
- **Soft Deletes**: is_active flag instead of hard deletes
- **Audit Trails**: created_at, updated_at timestamps
- **Tenant Isolation**: tenant_id on all models
- **UUID Primary Keys**: Distributed system compatibility
- **Indexed Foreign Keys**: Optimized query performance

## Technology Stack Integration

### Backend Stack
- **FastAPI**: Modern async Python web framework
- **SQLAlchemy**: ORM with async support
- **Alembic**: Database migrations
- **PostgreSQL**: Primary data store
- **Redis**: Caching and real-time features
- **Pydantic**: Data validation and serialization

### Frontend Stack
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **Axios**: HTTP client

### Infrastructure
- **Docker Compose**: Local development environment
- **PostgreSQL 15**: Relational database
- **Redis 7**: In-memory data store
- **Uvicorn**: ASGI server for FastAPI
