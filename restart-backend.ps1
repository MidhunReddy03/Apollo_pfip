#!/usr/bin/env pwsh

Write-Host "🔄 Restarting Apollo Backend..."
Write-Host ""

# Go to project directory
cd "C:\Users\Someonefromearth\Documents\apollo_dqms_final333"

Write-Host "Step 1: Stopping containers..."
docker-compose down

Write-Host ""
Write-Host "Step 2: Starting containers..."
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting 15 seconds for backend to start..."
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Step 3: Testing backend..."
try {
    $response = curl -s "http://localhost:8000/health" | ConvertFrom-Json
    Write-Host "✅ Backend is running! Status: $($response.status)"
    Write-Host ""
    Write-Host "Testing WhatsApp Bot..."
    $botTest = curl -s "http://localhost:8000/api/v1/whatsapp/test/%2B919876543210/hi" | ConvertFrom-Json
    Write-Host "✅ WhatsApp Bot responded: $($botTest.response)"
    Write-Host ""
    Write-Host "🎉 All systems operational!"
    Write-Host ""
    Write-Host "Visit: http://localhost:5173/whatsapp-bot"
} catch {
    Write-Host "⚠️  Backend still starting. Try again in 10 seconds."
}
