# Apollo DQMS 2.0 - Technology Stack

## Programming Languages

### Backend
- **Python 3.11+** - Primary backend language
- **SQL** - Database queries and migrations

### Frontend
- **TypeScript 5.3+** - Type-safe JavaScript
- **JavaScript (ES2022)** - Runtime language
- **CSS** - Styling (via Tailwind)
- **HTML** - Markup

## Backend Technologies

### Core Framework
- **FastAPI 0.109.0** - Modern async web framework
- **Uvicorn 0.27.0** - ASGI server with auto-reload
- **Python-multipart 0.0.6** - Form data handling

### Database & ORM
- **SQLAlchemy 2.0.25** - Async ORM
- **Alembic 1.13.1** - Database migrations
- **PostgreSQL 15+** - Primary database
- **psycopg2-binary 2.9.9** - PostgreSQL adapter
- **asyncpg 0.29.0** - Async PostgreSQL driver

### Caching & Real-time
- **Redis 7+** - Caching and pub/sub
- **redis 5.0.1** - Python Redis client
- **hiredis 2.3.2** - High-performance Redis parser
- **WebSockets 12.0** - Real-time communication

### Authentication & Security
- **python-jose[cryptography] 3.3.0** - JWT tokens
- **passlib[bcrypt] 1.7.4** - Password hashing
- **Pydantic[email] 2.5.3** - Data validation
- **pydantic-settings 2.1.0** - Settings management
- **python-dotenv 1.0.0** - Environment variables

### HTTP & Networking
- **httpx 0.26.0** - Async HTTP client
- **aiohttp 3.9.1** - Async HTTP client/server

### Utilities
- **python-dateutil 2.8.2** - Date/time utilities
- **pytz 2023.3** - Timezone support
- **structlog 24.1.0** - Structured logging

### Testing
- **pytest 7.4.4** - Testing framework
- **pytest-asyncio 0.23.3** - Async test support
- **pytest-cov 4.1.0** - Code coverage

### Code Quality
- **black 23.12.1** - Code formatter
- **flake8 7.0.0** - Linter
- **mypy 1.8.0** - Type checker
- **isort 5.13.2** - Import sorter

### ML/AI (Future Phases)
- **scikit-learn 1.4.0** - Machine learning
- **pandas 2.1.4** - Data analysis
- **numpy 1.26.3** - Numerical computing

## Frontend Technologies

### Core Framework
- **React 18.2.0** - UI library
- **React-DOM 18.2.0** - React renderer
- **TypeScript 5.3.3** - Type system

### Build Tools
- **Vite 5.0.11** - Build tool and dev server
- **@vitejs/plugin-react 4.2.1** - React plugin for Vite

### Routing & State
- **react-router-dom 6.21.1** - Client-side routing
- **zustand 4.4.7** - State management
- **@tanstack/react-query 5.17.9** - Server state management

### HTTP & Real-time
- **axios 1.6.5** - HTTP client
- **socket.io-client 4.6.1** - WebSocket client

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS
- **PostCSS 8.4.33** - CSS processor
- **Autoprefixer 10.4.16** - CSS vendor prefixes
- **lucide-react 0.303.0** - Icon library

### Data Visualization
- **recharts 2.10.3** - Chart library

### Utilities
- **date-fns 3.0.6** - Date utilities
- **qrcode 1.5.3** - QR code generation
- **react-qr-scanner 1.0.0-alpha.11** - QR code scanning

### Development Tools
- **ESLint 8.56.0** - JavaScript linter
- **@typescript-eslint/eslint-plugin 6.18.1** - TypeScript linting
- **@typescript-eslint/parser 6.18.1** - TypeScript parser
- **eslint-plugin-react-hooks 4.6.0** - React hooks linting
- **eslint-plugin-react-refresh 0.4.5** - React refresh linting

## Infrastructure

### Containerization
- **Docker** - Container runtime
- **Docker Compose** - Multi-container orchestration

### Databases
- **PostgreSQL 15+** - Primary relational database
- **Redis 7+** - In-memory cache and message broker

## Development Commands

### Backend Commands

#### Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Database Management
```bash
# Initialize database and create admin user
python init_db.py

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

#### Running the Server
```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000

# With custom host/port
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

#### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

#### Code Quality
```bash
# Format code
black app/

# Check formatting
black --check app/

# Lint code
flake8 app/

# Type check
mypy app/

# Sort imports
isort app/
```

### Frontend Commands

#### Environment Setup
```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name
```

#### Development
```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

#### Type Checking
```bash
# Check TypeScript types
npx tsc --noEmit
```

### Docker Commands

#### Container Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres

# View running containers
docker-compose ps

# Remove volumes (clean slate)
docker-compose down -v
```

#### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d apollo_dqms

# Connect to Redis
docker-compose exec redis redis-cli
```

## API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Environment Variables

### Backend (.env)
```
# Application
APP_NAME=Apollo DQMS 2.0
APP_VERSION=1.0.0
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/apollo_dqms

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Version Requirements

### Minimum Versions
- Python: 3.11+
- Node.js: 18+
- PostgreSQL: 15+
- Redis: 7+
- Docker: 20+
- Docker Compose: 2+

### Recommended Versions
- Python: 3.11 or 3.12
- Node.js: 18 LTS or 20 LTS
- PostgreSQL: 15 or 16
- Redis: 7.2+

## Build System

### Backend Build
- **Package Manager**: pip
- **Virtual Environment**: venv
- **Dependency File**: requirements.txt
- **Migration Tool**: Alembic

### Frontend Build
- **Package Manager**: npm
- **Build Tool**: Vite
- **Module System**: ES Modules
- **Output**: Static files (HTML, CSS, JS)

## Port Configuration

### Default Ports
- Backend API: 8000
- Frontend Dev Server: 5173
- PostgreSQL: 5432
- Redis: 6379

### Production Ports
- Backend API: 80 or 443 (with reverse proxy)
- Frontend: Served via CDN or static hosting
