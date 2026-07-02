@echo off
echo ===========================================
echo    Apollo PFIP 4.0 - Complete Installer
echo ===========================================
echo.

echo 🏥 Installing Apollo Patient Flow Intelligence Platform...

echo.
echo 1. Checking requirements...
python --version
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

node --version
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo ✅ Python and Node.js found!

echo.
echo 2. Setting up Backend...
cd backend

echo   Creating virtual environment...
python -m venv venv
call venv\Scripts\activate

echo   Installing dependencies...
pip install -r requirements.txt

echo   Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ⚠️ Please edit .env file with your database credentials
)

echo   Initializing database...
python init_db.py

echo.
echo 3. Setting up Frontend...
cd ..\frontend

echo   Installing dependencies...
npm install

echo   Setting up environment...
if not exist .env (
    copy .env.example .env
)

echo.
echo 4. Start instructions:
echo.
echo   1. Open PowerShell or CMD as Administrator
echo   2. Run the following commands:
echo.
echo   BACKEND:
echo   cd backend
echo   call venv\Scripts\activate
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo   FRONTEND (new terminal):
echo   cd frontend
echo   npm run dev
echo.
echo   3. Open browser to: http://localhost:5173
echo.
echo   4. Login with:
echo      - Admin: admin/admin123
echo      - Receptionist: receptionist/rec123
echo      - Doctor: doctor/doc123
echo      - Manager: manager/mgr123
echo      - Technician: technician/tech123
echo.
echo ===========================================
echo   🎉 SETUP COMPLETE!
echo   Run test_system.py to verify: python test_system.py
echo ===========================================
pause