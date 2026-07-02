# Apollo PFIP 4.0 - Patient Flow Intelligence Platform

## Overview
Apollo PFIP 4.0 is an AI-powered hospital operations intelligence platform designed for Apollo Hospital's patient workflow management. This system provides real-time monitoring, predictive analytics, and intelligent patient flow management.

## 🚀 Features

### 1. AI-Powered Triage Engine
- **P1/P2/P3 Classification**: Automatic priority assignment based on chief complaint analysis
- **Keyword-Based Analysis**: Medical keyword detection for fast triage
- **Risk Factor Scoring**: Age-based and medical history risk assessment
- **Department Recommendations**: AI-suggested departments based on symptoms
- **Confidence Scoring**: Transparency in AI decision-making

### 2. M/M/1 Queue Forecasting
- **Queue Theory Implementation**: Mathematical queue modeling using arrival (λ) and service (μ) rates
- **Wait Time Predictions**: Estimated wait times based on current queue state
- **Utilization Monitoring**: Real-time system utilization tracking
- **Priority Adjustments**: Queue timing adjusted by patient priority
- **30/60/120 Minute Forecasts**: Predictive analytics for resource planning

### 3. Discharge Gates System
- **Lab Reports Gate**: Track lab test results availability
- **Pharmacy Gate**: Medicine dispensing status
- **Clearance Gate**: Administrative and billing clearance
- **Progress Tracking**: Visual progress indicator for discharge process
- **Exit Pass Generation**: Digital QR-coded discharge passes

### 4. Comprehensive Audit Logging
- **100% Critical Coverage**: All patient-related transitions logged
- **HIPAA-Inspired**: Healthcare data protection compliance tracking
- **User Attribution**: Complete user activity tracking
- **Compliance Reporting**: Generated reports for regulatory requirements
- **Immutable Logs**: Secure audit trail

### 5. Real-Time Updates
- **WebSocket Integration**: Real-time event broadcasting
- **Live Dashboards**: Auto-updating metrics and status
- **Instant Alerts**: Critical event notifications
- **30-Second Refresh**: Automatic data updates

## 🏗️ Architecture

### Backend (Python/FastAPI)
```
backend/
├── app/
│   ├── api/
│   │   ├── triage.py          # Triage API endpoints
│   │   ├── queue_forecast.py   # Queue forecasting endpoints
│   │   ├── gates.py            # Discharge gates endpoints
│   │   ├── audit.py            # Audit log endpoints
│   │   └── websocket.py        # WebSocket handler
│   ├── services/
│   │   ├── triage_engine.py    # AI triage logic
│   │   ├── queue_forecast.py   # M/M/1 calculations
│   │   ├── gate_manager.py     # Gate orchestration
│   │   ├── audit_logger.py     # Audit management
│   │   └── websocket_manager.py # Real-time events
│   └── models/
│       ├── triage.py           # Triage models
│       ├── gate.py              # Gate models
│       └── audit_log.py        # Audit models
```

### Frontend (React/TypeScript)
```
frontend/src/
├── features/
│   ├── triage/
│   │   ├── components/
│   │   │   ├── TriageDashboard.tsx
│   │   │   └── TriageCard.tsx
│   │   ├── hooks/
│   │   └── types/
│   ├── gates/
│   │   ├── components/
│   │   │   ├── GateCard.tsx
│   │   │   ├── DischargeProgress.tsx
│   │   │   └── ExitPassDisplay.tsx
│   │   ├── hooks/
│   │   └── types/
│   ├── queue-forecast/
│   │   ├── components/
│   │   │   └── QueueMetricsDashboard.tsx
│   │   ├── hooks/
│   │   └── types/
│   └── audit/
│       ├── components/
│       │   └── AuditLogDashboard.tsx
│       ├── hooks/
│       └── types/
├── pages/
│   └── PFIPDashboard.tsx      # Main overview page
├── components/
│   └── PatientJourneyTracker.tsx
└── services/
    └── websocket.ts            # WebSocket client
```

## 📡 API Endpoints

### Triage
- `POST /api/v1/triage/classify` - AI triage classification
- `POST /api/v1/triage/records` - Create triage record
- `GET /api/v1/triage/records/{id}` - Get triage details
- `PUT /api/v1/triage/records/{id}` - Update triage priority
- `GET /api/v1/triage/queue/priority` - Get queue priority score

### Queue Forecasting
- `GET /api/v1/queue-forecast/metrics` - Current queue metrics (λ, μ, ρ)
- `GET /api/v1/queue-forecast/wait-time/predict` - Predict wait time
- `GET /api/v1/queue-forecast/forecast` - Multi-hour forecast
- `GET /api/v1/queue-forecast/status` - System status
- `GET /api/v1/queue-forecast/by-department` - Department breakdown

### Discharge Gates
- `POST /api/v1/gates/initialize` - Initialize discharge gates
- `GET /api/v1/gates/encounter/{id}` - Get encounter gates
- `PUT /api/v1/gates/{gate_id}` - Update gate status
- `POST /api/v1/gates/encounter/{id}/exit-pass` - Generate exit pass

### Audit Logs
- `GET /api/v1/audit/events` - Get audit trail
- `GET /api/v1/audit/critical` - Get critical events
- `GET /api/v1/audit/patient/{id}` - Patient audit trail
- `GET /api/v1/audit/statistics/summary` - Audit statistics
- `GET /api/v1/audit/compliance/report` - Compliance report

### WebSocket
- `WS /ws` - WebSocket connection
- Events: `triage_update`, `queue_update`, `gate_update`, `exit_pass_generated`, `system_alert`

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (optional)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
copy .env.example .env

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Set environment variables
copy .env.example .env

# Run development server
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws

## 🧪 Testing

New components can be tested by importing them in existing pages or creating new routes.

Example integration in App.tsx:
```tsx
import PFIPDashboard from './pages/PFIPDashboard';
import TriageDashboard from './features/triage/components/TriageDashboard';
import QueueMetricsDashboard from './features/queue-forecast/components/QueueMetricsDashboard';
import AuditLogDashboard from './features/audit/components/AuditLogDashboard';

// Add routes in your router configuration
```

## 📊 Key Metrics Tracked

### Queue Performance
- **Utilization (ρ)**: System load (should be < 1.0 for stability)
- **Arrival Rate (λ)**: Patients per hour
- **Service Rate (μ)**: Patients served per hour
- **Wait Time (Wq)**: Average queue wait time
- **Queue Length (Lq)**: Average queue length

### Triage Metrics
- **P1 Count**: Critical patients
- **P2 Count**: Urgent patients
- **P3 Count**: Routine patients
- **AI Accuracy**: Classification accuracy
- **Override Rate**: Nurse override percentage

### Gate Metrics
- **Completion Rate**: Gates completed percentage
- **Avg Gate Time**: Time per gate completion
- **Bottlenecks**: Identified problem areas

## 🔐 Security

- JWT Authentication
- Role-Based Access Control (RBAC)
- HIPAA-Inspired Data Handling
- Comprehensive Audit Logging
- IP Address Tracking

## 📈 Future Enhancements

1. **ML Model Integration**: Replace keyword-based triage with ML model
2. **Voice Recognition**: Voice-based symptom input
3. **Mobile App**: Patient-facing mobile application
4. **Integration**: HL7/FHIR integration with hospital systems
5. **Analytics Dashboard**: Advanced analytics and reporting
6. **SMS/WhatsApp**: Patient communication automation

## 🤝 Contributing

1. Follow feature-based architecture
2. Maintain TypeScript types
3. Write comprehensive tests
4. Document API endpoints
5. Follow HIPAA guidelines

## 📝 License

Proprietary - Apollo Hospitals

## 🎉 Demo Scenarios

### Scenario 1: Emergency Patient Flow
1. Patient arrives with chest pain
2. AI triage classifies as P1 (Critical)
3. Queue forecast shows 15-minute wait
4. Patient prioritized ahead of P3 cases
5. Doctor consultation completed
6. Discharge gates initialized
7. Lab, Pharmacy, Clearance gates tracked
8. Exit pass generated with QR code

### Scenario 2: System Monitoring
1. Dashboard shows 92% utilization
2. Alert triggered for high load
3. Queue forecast predicts 2-hour wait in 4 hours
4. Recommendation: Add temporary staff
5. Real-time updates every 30 seconds

---

**Built with ❤️ for Apollo Hospital's Patient Flow Intelligence Platform (PFIP) 4.0**