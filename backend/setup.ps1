# Apollo DQMS Backend Setup Script for Windows
Write-Host "=== Apollo DQMS 2.0 Backend Setup ===" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "`n[1/3] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Initialize database
Write-Host "`n[2/3] Initializing database..." -ForegroundColor Yellow
python init_db.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to initialize database. Make sure PostgreSQL is running." -ForegroundColor Red
    Write-Host "Start PostgreSQL with: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# Step 3: Start server
Write-Host "`n[3/3] Starting FastAPI server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "API docs at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Cyan

uvicorn app.main:app --reload
