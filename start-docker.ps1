# Apollo DQMS - Docker Setup (No Python Installation Required!)
Write-Host "=== Apollo DQMS 2.0 - Docker Setup ===" -ForegroundColor Cyan
Write-Host "This will run everything in Docker containers (no local Python needed)`n" -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "[1/4] Checking Docker Desktop..." -ForegroundColor Yellow
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "`nPlease start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host "Look for the Docker whale icon in your system tray.`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker Desktop is running`n" -ForegroundColor Green

# Build and start all services
Write-Host "[2/4] Building backend Docker image..." -ForegroundColor Yellow
docker-compose build backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend image" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Starting all services (PostgreSQL, Redis, Backend)..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services to be healthy
Write-Host "`n[4/4] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Initialize database
Write-Host "`nInitializing database..." -ForegroundColor Yellow
docker-compose exec backend python init_db.py

Write-Host "`n✅ Apollo DQMS Backend is running!" -ForegroundColor Green
Write-Host "`nAccess points:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  - Redis: localhost:6379" -ForegroundColor White

Write-Host "`nDefault credentials:" -ForegroundColor Cyan
Write-Host "  - Username: admin" -ForegroundColor White
Write-Host "  - Password: admin123" -ForegroundColor White
Write-Host "  - Tenant ID: apollo-main" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  - View logs: docker-compose logs -f backend" -ForegroundColor White
Write-Host "  - Stop services: docker-compose down" -ForegroundColor White
Write-Host "  - Restart backend: docker-compose restart backend" -ForegroundColor White

Write-Host "`nNow start the frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
