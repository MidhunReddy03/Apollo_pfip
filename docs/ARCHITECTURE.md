# Apollo DQMS 2.0 - Architecture Documentation

## System Overview

Apollo DQMS 2.0 is built as a modular monolith with clear boundaries that can be extracted into microservices as needed. The architecture follows modern best practices for scalability, security, and maintainability.

## Architecture Layers

### 1. Presentation Layer (Frontend)
- **Technology**: React 18 + TypeScript + Vite
- **State Management**: Zustand for global state
- **Data Fetching**: React Query for server state
- **Styling**: TailwindCSS for responsive design
- **Real-time**: WebSocket client for live updates

### 2. API Layer (Backend)
- **Framework**: FastAPI (Python)
- **API Style**: RESTful + WebSocket
- **Validation**: Pydantic schemas
- **Authentication**: JWT tokens
- **Documentation**: Auto-generated OpenAPI/Swagger

### 3. Business Logic Layer
- **Services**: Encapsulated business logic
- **Repositories**: Data access patterns
- **Domain Models**: SQLAlchemy ORM models

### 4. Data Layer
- **Primary Database**: PostgreSQL 15+
- **Caching**: Redis
- **ORM**: SQLAlchemy with async support
- **Migrations**: Alembic

## Core Modules

### Module 1: Identity & Access Management (IAM)
**Purpose**: Authentication, authorization, and multi-tenant isolation

**Components**:
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-tenant context middleware
- Session management

**Models**: User, Role, Permission

### Module 2: Patient Management
**Purpose**: Patient registration, demographics, and triage

**Components**:
- Patient CRUD operations
- QR code generation
- Triage classification
- Visit history tracking

**Models**: Patient

### Module 3: Encounter Management
**Purpose**: Track patient visits and workflow states

**Components**:
- Encounter lifecycle management
- State machine for workflow
- Timeline tracking
- Audit trail

**Models**: Encounter

### Module 4: Queue Orchestration Engine
**Purpose**: Dynamic queue management and priority scheduling

**Components**:
- Priority scoring algorithm
- Dynamic rerouting
- Wait time estimation
- Load balancing

**Models**: Queue

**Algorithm**: Hybrid Dynamic Priority Scoring
```
Priority Score = 
  (Emergency Weight × Emergency Level) +
  (SLA Weight × Time Waiting) +
  (Department Weight × Department Priority) +
  (Equipment Weight × Equipment Availability) +
  (Clinical Weight × Clinical Dependencies)
```

### Module 5: Clinical Sequencing Engine
**Purpose**: Dependency-aware test ordering and sequencing

**Components**:
- Clinical rules engine
- Dependency graph
- Sequence optimization
- TAT minimization

**Models**: ClinicalRule, TestSequence

### Module 6: Station & Equipment Management
**Purpose**: Resource tracking and allocation

**Components**:
- Station status monitoring
- Equipment availability
- Technician assignment
- Utilization tracking

**Models**: Station, Equipment, Technician

### Module 7: Real-time Communication Layer
**Purpose**: Live synchronization across all clients

**Components**:
- WebSocket server
- Event broadcasting
- Room-based channels
- Connection management

**Technology**: FastAPI WebSockets + Redis Pub/Sub

### Module 8: Notification System
**Purpose**: Multi-channel patient and staff notifications

**Components**:
- SMS gateway (Twilio)
- WhatsApp Business API
- Email service (SendGrid)
- In-app notifications
- Digital signage

**Models**: Notification, NotificationTemplate

### Module 9: Navigation & Tracking
**Purpose**: Patient movement and wayfinding

**Components**:
- QR checkpoint system
- Indoor navigation
- Movement tracking
- Location history

**Models**: Checkpoint, PatientLocation

### Module 10: Analytics & Intelligence
**Purpose**: Operational insights and predictions

**Components**:
- Real-time metrics dashboard
- Historical analytics
- ML prediction models
- Recommendation engine

**Models**: Metric, Report

**ML Models**:
- Wait time prediction (Regression)
- Congestion forecasting (Time Series)
- No-show prediction (Classification)
- Bottleneck detection (Anomaly Detection)

### Module 11: Integration Layer
**Purpose**: External system connectivity

**Components**:
- HIS/EMR integration
- RIS/LIS integration
- Billing system integration
- API orchestration
- Webhook support

**Models**: Integration, SyncLog

## Data Model

### Core Entities

```
User (IAM)
├── Patient (1:1 optional)
└── Technician (1:1 optional)

Patient
├── Encounters (1:N)
└── PatientLocation (1:N)

Encounter
├── Queues (1:N)
├── TestSequence (1:1)
└── Notifications (1:N)

Station
├── Queues (1:N)
├── Equipment (1:N)
└── Technicians (N:M)

Queue
├── Encounter (N:1)
└── Station (N:1)
```

### Multi-Tenancy

All tenant-scoped models inherit from `TenantBaseModel`:
- Automatic tenant_id injection
- Tenant-scoped queries
- Data isolation enforcement

## Security Architecture

### Authentication Flow
1. User submits credentials
2. Backend validates and generates JWT
3. JWT contains: user_id, tenant_id, role, expiry
4. Client stores JWT in localStorage
5. JWT sent in Authorization header for all requests

### Authorization
- Role-based access control (RBAC)
- Granular permissions per endpoint
- Tenant isolation at middleware level
- Resource-level permissions

### Data Protection
- Passwords: bcrypt hashing
- PII: Encryption at rest
- Transit: TLS/HTTPS only
- Audit: All actions logged

## Real-time Architecture

### WebSocket Flow
1. Client connects with JWT authentication
2. Server validates and assigns to tenant room
3. Events broadcast to room subscribers
4. Automatic reconnection on disconnect

### Event Types
- `queue.updated`: Queue position changes
- `station.status`: Station availability changes
- `encounter.state`: Encounter workflow updates
- `notification.new`: New notifications

## Scalability Strategy

### Phase 1: Modular Monolith (Current)
- Single deployment unit
- Clear module boundaries
- Shared database
- Suitable for: 1-10 hospitals, <10K daily patients

### Phase 2: Service Extraction
- Extract high-load modules (Queue Engine, Real-time)
- Separate databases per service
- Event-driven communication
- Suitable for: 10-50 hospitals, <100K daily patients

### Phase 3: Microservices
- Full service decomposition
- API Gateway
- Service mesh
- Kubernetes orchestration
- Suitable for: 50+ hospitals, 100K+ daily patients

## Performance Optimization

### Database
- Connection pooling (20 connections)
- Query optimization with indexes
- Materialized views for analytics
- Read replicas for reporting

### Caching Strategy
- Redis for session data
- Query result caching (TTL: 1 hour)
- Real-time data: No caching
- Static data: Long TTL

### API Performance
- Async/await throughout
- Pagination for list endpoints
- Field selection (sparse fieldsets)
- Response compression

## Monitoring & Observability

### Metrics
- Request latency (p50, p95, p99)
- Error rates
- Queue lengths
- Station utilization
- Database query performance

### Logging
- Structured JSON logs
- Request/response logging
- Error tracking with stack traces
- Audit trail for all mutations

### Alerting
- High error rates
- Slow response times
- Database connection issues
- Queue bottlenecks

## Deployment Architecture

### Development
- Docker Compose
- Local PostgreSQL + Redis
- Hot reload enabled

### Staging
- Docker containers
- Managed PostgreSQL (RDS/Cloud SQL)
- Managed Redis (ElastiCache/MemoryStore)
- Load balancer

### Production
- Kubernetes cluster
- Multi-AZ database
- Redis cluster
- CDN for frontend
- Auto-scaling enabled
- Blue-green deployment

## Technology Decisions

### Why FastAPI?
- High performance (async)
- Auto-generated API docs
- Type safety with Pydantic
- Modern Python features
- WebSocket support

### Why React?
- Component reusability
- Large ecosystem
- TypeScript support
- Excellent tooling
- Real-time updates with hooks

### Why PostgreSQL?
- ACID compliance
- JSON support
- Full-text search
- Mature and reliable
- Excellent performance

### Why Redis?
- In-memory speed
- Pub/Sub for real-time
- Session storage
- Queue management
- Caching layer

## Future Enhancements

### Phase 4: Intelligence
- Advanced ML models
- Predictive scheduling
- Automated optimization
- Natural language interface

### Phase 5: Enterprise
- Multi-region deployment
- Advanced analytics
- Mobile apps (iOS/Android)
- BLE beacon integration
- Voice notifications
- Telemedicine integration
