# Apollo PFIP 4.0 - Quick Verification

To verify everything is working:

## ✅ Quick Verification Steps

### 1. Check System Dependencies
```bash
# Check Python
python --version
# Should show: Python 3.x.x

# Check Node.js
node --version
# Should show: v18.x.x or higher

# Check npm
npm --version
```

### 2. Run Backend Test
```bash
cd backend
python test_system.py
```
**Expected Output:**
```
🧪 Apollo PFIP 4.0 System Test
1. Checking imports... ✓
2. Testing database connection... ✓
3. Testing AI Triage Engine... ✓
4. Testing Queue Forecasting... ✓
5. Testing Gate Manager... ✓
6. Testing Audit Logger... ✓
🎉 ALL TESTS COMPLETED SUCCESSFULLY!
```

### 3. Start the System
```bash
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Verify Endpoints

Open in browser:
1. **Frontend**: http://localhost:5173 → Should show login/dashboard
2. **Backend API**: http://localhost:8000/docs → Should show Swagger UI
3. **Health Check**: http://localhost:8000/health → `{"status": "healthy", "version": "4.0.0"}`

### 5. Quick System Check
Open PowerShell and run:
```powershell
# Check if services are running
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/patients

# Test WebSocket
# Open browser console and try: new WebSocket("ws://localhost:8000/ws")
```

## 🔧 Common Issues & Fixes

### Issue: Database connection failed
**Fix:**
```bash
# Edit backend/.env with correct PostgreSQL credentials
DATABASE_URL=postgresql://username:password@localhost:5432/apollo_pfip

# Reinitialize database
cd backend
python init_db.py
```

### Issue: Port 8000 already in use
**Fix:**
```bash
# Change port in backend/.env
PORT=8001

# Or kill existing process
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F
```

### Issue: npm install failed
**Fix:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Python import errors
**Fix:**
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt --force-reinstall
```

## 📊 What's Verified

✅ **Backend:**
- FastAPI application
- Database models and migrations
- AI Triage Engine
- M/M/1 Queue Forecasting
- Gate Management System
- Audit Logging System
- WebSocket real-time updates

✅ **Frontend:**
- React TypeScript setup
- Feature-based architecture
- Triage dashboard
- Queue forecasting dashboard
- Discharge gates UI
- Audit log dashboard
- Real-time updates via WebSocket

✅ **Integration:**
- API endpoints responding
- Database connectivity
- Authentication working
- Real-time events
- QR code generation
- Patient journey tracking

## 🚀 Production Notes

For deployment:
1. Update `.env` files with production values
2. Set `DEBUG=false` in backend/.env
3. Use PostgreSQL in production
4. Configure proper CORS origins
5. Set secure JWT secrets
6. Enable HTTPS
7. Set up monitoring/logging

## 🎉 SUCCESS INDICATORS

If all checks pass:
1. 🟢 Backend server running on port 8000
2. 🟢 Frontend server running on port 5173
3. 🟢 Database connection established
4. 🟢 API documentation accessible at /docs
5. 🟢 WebSocket connection possible
6. 🟢 All components rendering properly

**Congratulations! Apollo PFIP 4.0 is ready for use!**