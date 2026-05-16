# Apollo DQMS 2.0 - Development Guidelines

## Code Quality Standards

### Python Backend Standards

#### File Organization
- Empty `__init__.py` files in all packages for proper module structure
- One class/router per file with descriptive names
- Group related functionality in dedicated directories (api/, models/, schemas/, etc.)

#### Import Conventions
```python
# Standard library imports first
from datetime import datetime, timedelta
from typing import Optional

# Third-party imports second
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import Column, String
from pydantic import BaseModel, EmailStr, Field

# Local imports last
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_password
```

#### Naming Conventions
- **Files**: Snake_case (e.g., `auth.py`, `user.py`, `session.py`)
- **Classes**: PascalCase (e.g., `User`, `UserCreate`, `TenantBaseModel`)
- **Functions**: Snake_case (e.g., `get_current_user`, `verify_password`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Enums**: PascalCase class, UPPER_SNAKE_CASE values (e.g., `UserRole.SUPER_ADMIN`)

#### Type Hints
- Always use type hints for function parameters and return values
- Use `Optional[T]` for nullable values
- Use `List[T]`, `Dict[K, V]` for collections
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    pass

async def get_db() -> AsyncSession:
    pass
```

### TypeScript Frontend Standards

#### File Organization
- PascalCase for component files (e.g., `LoginPage.tsx`, `DashboardPage.tsx`)
- camelCase for utility files (e.g., `api.ts`, `auth.ts`, `index.ts`)
- Group by feature/domain in directories

#### Import Conventions
```typescript
// React imports first
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Third-party imports second
import axios, { AxiosInstance } from 'axios';
import { create } from 'zustand';

// Local imports last
import { useAuthStore } from './store';
import { authService } from './services/auth';
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `LoginPage`, `ProtectedRoute`)
- **Functions**: camelCase (e.g., `isAuthenticated`, `setUser`)
- **Interfaces**: PascalCase with descriptive names (e.g., `AuthState`, `QueueState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

#### Type Safety
- Always define interfaces for state and props
- Use TypeScript generics for reusable functions
- Avoid `any` type - use specific types or `unknown`
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

async get<T>(url: string, params?: any): Promise<T> {
  const response = await this.client.get<T>(url, { params });
  return response.data;
}
```

## Architectural Patterns

### Backend Architecture

#### Multi-tenant Pattern
All models inherit from `TenantBaseModel` for automatic tenant isolation:
```python
class TenantBaseModel(BaseModel):
    __abstract__ = True
    tenant_id = Column(String(50), nullable=False, index=True)

class User(TenantBaseModel):
    __tablename__ = "users"
    # tenant_id automatically included
```

#### Base Model Pattern
Common fields in `BaseModel` for all entities:
```python
class BaseModel(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
```

#### Async Database Pattern
Use async/await for all database operations:
```python
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

#### Router Pattern
FastAPI routers with prefix and tags:
```python
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    pass
```

#### Dependency Injection Pattern
Use FastAPI's `Depends` for dependencies:
```python
async def register(
    user_data: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    pass

async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    pass
```

### Frontend Architecture

#### Protected Route Pattern
Wrap authenticated routes with protection:
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

#### API Client Pattern
Centralized HTTP client with interceptors:
```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
        }
        return Promise.reject(error);
      }
    );
  }
}
```

#### Zustand Store Pattern
Simple, typed state management:
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## Security Patterns

### Authentication Flow
1. User submits credentials
2. Backend validates and creates JWT tokens
3. Frontend stores tokens in localStorage
4. All requests include Bearer token in Authorization header
5. Backend validates token on protected routes

### JWT Token Pattern
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

### Password Hashing Pattern
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

### Middleware Authentication Pattern
```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = security):
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    
    return payload
```

## Database Patterns

### SQLAlchemy Async Pattern
```python
# Query with async
result = await db.execute(select(User).where(User.email == email))
user = result.scalar_one_or_none()

# Create with async
user = User(**data)
db.add(user)
await db.commit()
await db.refresh(user)
```

### Enum Pattern
```python
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    HOSPITAL_ADMIN = "hospital_admin"
    RECEPTIONIST = "receptionist"

# In model
role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
```

### Relationship Pattern (for future use)
```python
# In User model
created_patients = relationship("Patient", back_populates="created_by")

# In Patient model
created_by = relationship("User", back_populates="created_patients")
```

## Validation Patterns

### Pydantic Schema Pattern
```python
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    tenant_id: str

class UserResponse(UserBase):
    id: int
    tenant_id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy model conversion
```

## Error Handling Patterns

### Backend Error Pattern
```python
# Check existence
result = await db.execute(select(User).where(User.email == email))
if result.scalar_one_or_none():
    raise HTTPException(status_code=400, detail="Email already registered")

# Authentication error
if not user or not verify_password(password, user.hashed_password):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

# Not found error
if not user:
    raise HTTPException(status_code=404, detail="User not found")
```

### Frontend Error Pattern
```typescript
// Axios interceptor handles 401 globally
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Configuration Patterns

### Settings Pattern (Backend)
```python
class Settings(BaseSettings):
    APP_NAME: str = "Apollo DQMS 2.0"
    DATABASE_URL: str
    SECRET_KEY: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### Environment Variables Pattern (Frontend)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Common Code Idioms

### Backend Idioms

#### Token Data Structure
```python
token_data = {
    "sub": str(user.id),
    "user_id": user.id,
    "tenant_id": user.tenant_id,
    "role": user.role.value,
}
```

#### Database Query Pattern
```python
result = await db.execute(select(Model).where(Model.field == value))
instance = result.scalar_one_or_none()
```

#### Response Model Pattern
```python
@router.post("/endpoint", response_model=ResponseSchema, status_code=status.HTTP_201_CREATED)
async def endpoint(data: RequestSchema, db: AsyncSession = Depends(get_db)):
    return created_instance
```

### Frontend Idioms

#### Local Storage Pattern
```typescript
localStorage.setItem('access_token', token);
localStorage.getItem('access_token');
localStorage.removeItem('access_token');
```

#### Conditional Rendering
```typescript
return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
```

#### Store Update Pattern
```typescript
set((state) => ({ 
  items: state.items.map((item) => 
    item.id === id ? { ...item, ...updates } : item
  )
}))
```

## Testing Patterns (Future)

### Backend Test Pattern
```python
@pytest.mark.asyncio
async def test_register_user():
    # Arrange
    user_data = {"email": "test@example.com", ...}
    
    # Act
    response = await client.post("/api/v1/auth/register", json=user_data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
```

### Frontend Test Pattern
```typescript
describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });
});
```

## Documentation Standards

### Docstring Pattern (Python)
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Token payload data
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    pass
```

### Comment Pattern
- Use comments sparingly - prefer self-documenting code
- Comment "why" not "what"
- Use TODO comments for future work: `# TODO: Add rate limiting`

## Best Practices

### Backend Best Practices
1. Always use async/await for database operations
2. Use dependency injection for database sessions
3. Validate input with Pydantic schemas
4. Use proper HTTP status codes
5. Include tenant_id in all multi-tenant queries
6. Hash passwords before storing
7. Use environment variables for secrets
8. Implement proper error handling with HTTPException

### Frontend Best Practices
1. Use TypeScript for type safety
2. Centralize API calls in service layer
3. Use Zustand for global state management
4. Implement protected routes for authentication
5. Store tokens securely (localStorage for now, httpOnly cookies for production)
6. Handle 401 errors globally with interceptors
7. Use environment variables for configuration
8. Implement proper loading and error states

### Security Best Practices
1. Never commit secrets or credentials
2. Use JWT tokens with expiration
3. Implement refresh token rotation
4. Validate all user input
5. Use HTTPS in production
6. Implement rate limiting (future)
7. Add CSRF protection (future)
8. Audit log sensitive operations (future)
