# Apollo PFIP 4.0 - Complete Setup and Run Guide

## 📋 System Requirements
- **Python 3.8+**
- **Node.js 18+**
- **PostgreSQL** (Running locally or via Docker)
- **Git** (optional)

## 🚀 Quick Start (Complete Setup)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment file (copy from example)
copy .env.example .env

# Edit .env file with your database settings:
# DATABASE_URL=postgresql://username:password@localhost:5432/apollo_pfip
```

### 2. Database Setup

```bash
# Initialize database (creates tables and seeds admin user)
python init_db.py

# Or use the setup script:
.\setup.ps1
```

### 3. Start Backend Server

```bash
# Run the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Server will be available at: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### 4. Frontend Setup (New Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment
copy .env.example .env
# Edit .env file:
# VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev

# Frontend will be available at: http://localhost:5173
```

## ✅ Verification

Once both servers are running, verify the setup:

### Backend Health Check
```
http://localhost:8000/health
→ Should return: {"status": "healthy", "version": "4.0.0"}
```

### API Documentation
```
http://localhost:8000/docs
→ Should show Swagger UI with all endpoints
```

### Frontend Homepage
```
http://localhost:5173
→ Should show Apollo PFIP login/dashboard
```

## 🧪 Default Login Credentials

```
Admin User:
- Username: admin
- Password: admin123

Receptionist:
- Username: receptionist  
- Password: rec123

Doctor:
- Username: doctor
- Password: doc123

Floor Manager:
- Username: manager
- Password: mgr123

Technician:
- Username: technician
- Password: tech123
```

## 🔧 Database Configuration

Edit `backend/.env` with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/apollo_pfip
JWT_SECRET_KEY=your-super-secret-jwt-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEBUG=true
```

## 🐳 Docker Setup (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# This will start:
# - PostgreSQL database
# - Backend API (port 8000)
# - Frontend (port 5173)
```

## 📡 Testing All Features

### 1. AI Triage System
```
POST http://localhost:8000/api/v1/triage/classify
Body: {"encounter_id": 1, "chief_complaint": "Patient with severe chest pain and dizziness"}
```

### 2. Queue Forecasting
```
GET http://localhost:8000/api/v1/queue-forecast/metrics
→ Returns λ/μ/ρ and wait time predictions
```

### 3. Discharge Gates
```
POST http://localhost:8000/api/v1/gates/initialize
Body: {"encounter_id": 1}
→ Initializes Lab, Pharmacy, Clearance gates
```

### 4. Real-Time WebSocket
```
WebSocket: ws://localhost:8000/ws
→ Subscribe to real-time events
```

### 5. Audit Logs
```
GET http://localhost:8000/api/v1/audit/events
→ Shows activity history
```

## 🏗️ Project Structure

```
apollo_dqms_final333/
├── backend/
│   ├── app/
│   │   ├── api/              # All API endpoints (triage, queue-forecast, gates, audit, websocket)
│   │   ├── services/         # Business logic (triage_engine, queue_forecast, gate_manager, audit_logger)
│   │   └── models/           # Database models (triage.py, gate.py, exit_pass.py, audit_log.py)
│   ├── .env                  # Configuration
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── features/         # Feature-based modules (triage, gates, queue-forecast, audit)
│   │   ├── pages/           # Page components (PFIPDashboard.tsx)
│   │   ├── components/      # Reusable components (PatientJourneyTracker.tsx)
│   │   └── services/       # API clients and WebSocket
│   └── package.json
├── .workspace/              # Development tracking files
└── RUN_GUIDE.md            # This file
```

## ⚡ Quick Run Commands

### Windows PowerShell:
```powershell
# Start backend
cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend (new terminal)
cd frontend; npm run dev
```

### Mac/Linux:
```bash
# Start backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend (new terminal)
cd frontend && npm run dev
```

## 🔍 Troubleshooting

### 1. Database Connection Error
```bash
# Ensure PostgreSQL is running
# Update DATABASE_URL in .env
# Run: python init_db.py
```

### 2. Module Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
npm install
```

### 3. Port Already in Use
```bash
# Change ports in .env files:
# Backend: Change port 8000
# Frontend: Modify vite.config.ts
```

### 4. JWT Token Issues
```bash
# Ensure JWT_SECRET_KEY is set in .env
# Clear browser localStorage and login again
```

### 5. WebSocket Connection Failed
```bash
# Check if WebSocket endpoint is running
# ws://localhost:8000/ws should connect
```

## 📊 Monitoring

While running, check:
- **Backend logs** in terminal for API activity
- **Frontend console** in browser DevTools
- **Database logs** via pgAdmin or psql
- **System load** at `/health` endpoint

## 🎯 Demo Scenario

To demonstrate the complete system:

1. **Login** as receptionist (`receptionist/rec123`)
2. **Create a patient** via UI
3. **Triage the patient** (AI automatically classifies)
4. **Check queue forecast** (see wait time predictions)
5. **Initialize discharge gates** for an encounter
6. **Update gates** (mark as complete)
7. **Generate exit pass** (QR code)
8. **View audit logs** of all activities

## 📞 Support

For issues:
1. Check logs for error messages
2. Verify database connection
3. Ensure all services are running
4. Check API documentation at `/docs`

## 🎉 Success Message

If everything is working, you should see:
- Backend: `Uvicorn running on http://0.0.0.0:8000`
- Frontend: `Vite server running at http://localhost:5173`
- Database: Tables created with seed data
- WebSocket: Connection established

**Congrats! Apollo PFIP 4.0 is now running! 🏥✨**

---

**Next Steps:**
1. Test all features via the UI
2. Explore API documentation
3. Try the demo scenario
4. Check real-time updates via WebSocket