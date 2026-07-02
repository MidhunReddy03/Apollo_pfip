# 🏥 Apollo PFIP 4.0 - Patient Flow Intelligence Platform

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-orange.svg)](LICENSE)

**AI-Powered Hospital Operations & Patient Flow Management System**

## ✨ Features

### 🤖 AI-Powered Triage Engine
- **P1/P2/P3 Classification** - Automatic patient priority assignment
- **Keyword-Based Analysis** - Medical symptom keyword detection
- **Risk Factor Scoring** - Age-based and medical history assessment
- **Department Recommendations** - AI-suggested departmental routing
- **Confidence Scoring** - Transparent AI decision-making with accuracy metrics

### 📊 M/M/1 Queue Forecasting
- **Mathematical Queue Theory** - λ (arrival rate) / μ (service rate) calculations
- **Wait Time Predictions** - Real-time queue wait time estimates
- **Utilization Monitoring** - System load tracking with ρ < 1.0 stability checks
- **Priority Adjustments** - Queue timing adjusted by patient priority
- **30/60/120 Minute Forecasts** - Predictive analytics for resource planning

### 🚪 Discharge Gates System
- **Lab Reports Gate** - Lab test results completion tracking
- **Pharmacy Gate** - Medicine dispensing status monitoring
- **Clearance Gate** - Administrative and billing settlement tracking
- **Progress Visualization** - Visual progress indicators for discharge process
- **QR Exit Pass Generation** - Digital discharge passes with scannable QR codes

### 📝 Comprehensive Audit Logging
- **100% Critical Event Coverage** - All patient-related transitions logged
- **HIPAA-Inspired Compliance** - Healthcare data protection compliance tracking
- **User Attribution** - Complete user activity tracking
- **Immutable Audit Trail** - Secure, tamper-proof activity records
- **Compliance Reporting** - Generated reports for regulatory requirements

### 🔄 Real-Time Updates
- **WebSocket Integration** - Real-time event broadcasting
- **Live Dashboards** - Auto-updating metrics and status displays
- **Instant Alerts** - Critical event notifications
- **30-Second Refresh** - Automatic data updates for current state

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL toolkit and ORM with async support
- **JWT Authentication** - Secure authentication with role-based access
- **PostgreSQL** - Production-ready relational database
- **WebSockets** - Real-time bidirectional communication
- **Task Queue** - Background job processing

### Frontend (React/TypeScript)
- **React 18** - UI library with hooks and suspense
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Axios** - HTTP client for API calls
- **WebSocket Client** - Real-time event handling
- **Feature-Based Structure** - Modular, maintainable codebase

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd apollo_dqms_final333

# Option 1: One-click setup (Windows)
RUN_NOW.bat

# Option 2: Manual setup

# Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
copy .env.example .env  # Edit with your DB credentials
python init_db.py

# Frontend setup
cd ../frontend
npm install
copy .env.example .env  # Set VITE_API_URL

# Start both servers
# Terminal 1 (Backend):
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 (Frontend):
cd frontend && npm run dev
```

### Access Points
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **WebSocket:** ws://localhost:8000/ws

### Default Credentials
```
Admin:        admin / admin123
Receptionist: receptionist / rec123
Doctor:       doctor / doc123
Manager:      manager / mgr123
Technician:   technician / tech123
```

## 📁 Project Structure

```
apollo_dqms_final333/
├── backend/
│   ├── app/
│   │   ├── api/              # All API endpoints (FastAPI routers)
│   │   │   ├── triage.py          # Triage API endpoints
│   │   │   ├── queue_forecast.py  # Queue forecasting endpoints
│   │   │   ├── gates.py           # Discharge gates endpoints
│   │   │   ├── audit.py           # Audit log endpoints
│   │   │   └── websocket.py       # WebSocket handler
│   │   ├── services/         # Business logic layer
│   │   │   ├── triage_engine.py    # AI triage logic
│   │   │   ├── queue_forecast.py   # M/M/1 calculations
│   │   │   ├── gate_manager.py     # Gate orchestration
│   │   │   ├── audit_logger.py     # Audit management
│   │   │   └── websocket_manager.py # Real-time events
│   │   ├── models/          # Database models
│   │   │   ├── triage.py          # Triage models
│   │   │   ├── gate.py            # Gate models
│   │   │   ├── exit_pass.py       # Exit pass models
│   │   │   ├── audit_log.py      # Audit models
│   │   │   └── ...                # Other models
│   │   └── core/            # Configuration and middleware
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── features/        # Feature-based modules
│   │   │   ├── triage/      # Triage feature
│   │   │   ├── gates/       # Gates feature
│   │   │   ├── queue-forecast/ # Queue forecasting
│   │   │   └── audit/       # Audit feature
│   │   ├── pages/           # Page components
│   │   │   └── PFIPDashboard.tsx # Main dashboard
│   │   ├── components/      # Reusable components
│   │   │   └── PatientJourneyTracker.tsx # 7-step journey
│   │   ├── services/        # API clients
│   │   │   └── websocket.ts # WebSocket client
│   │   └── types/           # TypeScript types
│   ├── package.json         # Node.js dependencies
│   └── .env.example         # Frontend environment
├── .workspace/              # Development tracking files
├── RUN_GUIDE.md            # Complete run guide
├── RUN_NOW.bat             # One-click runner (Windows)
├── test_system.py          # System verification test
└── README.md               # This file
```

## 🧪 Testing

### System Verification
```bash
cd backend
python test_system.py
```

### Unit Tests
```bash
# Backend tests
pytest tests/

# Frontend tests
cd frontend
npm test
```

### API Testing
```bash
# Test AI triage
curl -X POST "http://localhost:8000/api/v1/triage/classify" \
  -H "Content-Type: application/json" \
  -d '{"chief_complaint": "severe chest pain"}'
```

## 📈 Key Metrics Tracked

### Queue Performance
- **Utilization (ρ)**: System load (should be < 1.0 for stability)
- **Arrival Rate (λ)**: Patients per hour
- **Service Rate (μ)**: Patients served per hour
- **Wait Time (Wq)**: Average queue wait time
- **Queue Length (Lq)**: Average queue length

### Triage Metrics
- **P1/P2/P3 Counts**: Critical/Urgent/Routine patient counts
- **AI Accuracy**: Classification accuracy %
- **Nurse Override Rate**: Manual override percentage
- **Average Processing Time**: Time per classification

### Gate Metrics
- **Completion Rate**: Gates completed percentage
- **Average Gate Time**: Time per gate completion
- **Bottleneck Identification**: Problem area detection

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Granular permission system
- **HIPAA-Inspired Data Handling** - Healthcare data protection
- **Comprehensive Audit Logging** - Complete activity tracking
- **IP Address Tracking** - Security event correlation
- **Input Validation** - Protection against injection attacks

## 🎯 Demo Scenarios

### Emergency Patient Flow
1. Patient arrives with chest pain symptoms
2. AI triage classifies as P1 (Critical)
3. Queue forecast shows 15-minute wait
4. Patient prioritized ahead of routine cases
5. Doctor consultation completed
6. Discharge gates initialized and tracked
7. Lab, Pharmacy, Clearance gates completed
8. QR exit pass generated for discharge

### System Monitoring Scenario
1. Dashboard shows 92% utilization (alert triggered)
2. Queue forecast predicts 2-hour wait in 4 hours
3. Recommendation: Add temporary staff
4. Real-time updates show queue clearing
5. Audit logs track all staff actions

## 📝 Documentation

- **API Documentation**: Swagger UI at `/docs`
- **Database Schema**: ER diagrams in `/docs/database`
- **Deployment Guide**: `DEPLOYMENT.md`
- **API Reference**: Generated OpenAPI specification
- **User Manual**: `USER_GUIDE.md`
- **Developer Guide**: `DEVELOPER.md`

## 🤝 Contributing

1. **Feature-Based Development** - Follow modular architecture
2. **TypeScript Types** - Maintain comprehensive type definitions
3. **API Documentation** - Document all endpoints
4. **Testing** - Write unit and integration tests
5. **Code Review** - Submit PRs for review
6. **Commit Messages** - Use conventional commit format

## 📄 License

Proprietary software - © Apollo Hospitals

## 📞 Support

For issues, questions, or contributions:
1. Check existing documentation
2. Review API documentation at `/docs`
3. Check system logs for errors
4. Test API endpoints directly
5. Review database connectivity

## 🏆 Acknowledgments

- **FastAPI** - For the excellent web framework
- **React** - For the UI library
- **PostgreSQL** - For reliable database system
- **Queue Theory** - For mathematical foundation
- **Healthcare Professionals** - For domain expertise

---

**Built with ❤️ for Apollo Hospital's Patient Flow Intelligence Platform (PFIP) 4.0**

---

## 🔗 Links

- [API Documentation](http://localhost:8000/docs)
- [System Health](http://localhost:8000/health)
- [Frontend Application](http://localhost:5173)
- [Run Guide](RUN_GUIDE.md)
- [Verification Guide](VERIFY.md)
- [Installation Script](RUN_NOW.bat)