@echo off
echo ===========================================
echo    APOLLO PFIP 4.0 - ONE-COMMAND RUN
echo ===========================================
echo.

echo 🚀 Starting Apollo PFIP System...

echo.
echo 📦 Checking requirements...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo ✅ All requirements satisfied!

echo.
echo 🔧 Setting up backend...
cd backend

REM Check if virtual environment exists
if not exist venv\Scripts\python.exe (
    echo   Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies if needed
if not exist .env (
    echo   Setting up environment...
    copy .env.example .env
    echo ⚠️ Please edit .env file with your PostgreSQL credentials
)

echo   Starting backend server...
start "Apollo Backend" cmd /k "cd /d %cd% && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo 🎨 Setting up frontend...
cd ..\frontend

if not exist node_modules (
    echo   Installing frontend dependencies...
    npm install --silent
)

if not exist .env (
    copy .env.example .env
)

echo   Starting frontend server...
start "Apollo Frontend" cmd /k "cd /d %cd% && npm run dev"

echo.
echo ===========================================
echo   🎉 APOLLO PFIP 4.0 IS NOW RUNNING!
echo ===========================================
echo.
echo 📍 IMPORTANT INFO:
echo.
echo   👉 BACKEND: http://localhost:8000/
echo   👉 FRONTEND: http://localhost:5173/
echo   👉 API DOCS: http://localhost:8000/docs
echo.
echo   📱 LOGIN CREDENTIALS:
echo     Admin: admin / admin123
echo     Receptionist: receptionist / rec123
echo     Doctor: doctor / doc123
echo     Manager: manager / mgr123
echo     Technician: technician / tech123
echo.
echo   ⚠️ If you see errors:
echo     1. Check if PostgreSQL is running
echo     2. Update database credentials in backend/.env
echo     3. Run: python backend/init_db.py
echo.
echo ===========================================
echo   Press any key to open the application...
pause >nul

REM Open the frontend in default browser
start http://localhost:5173

echo.
echo 💡 TIPS:
echo   • Keep both consoles open
echo   • Backend console shows API requests
echo   • Refresh frontend to see updates
echo   • Test API at: http://localhost:8000/docs
echo.
echo Enjoy Apollo PFIP 4.0! 🏥✨
pause