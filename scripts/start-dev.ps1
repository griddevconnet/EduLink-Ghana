# EduLink Ghana - Development Startup Script
# This script starts all services for local development

Write-Host "🚀 Starting EduLink Ghana Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running (for local databases)
Write-Host "📦 Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker is running" -ForegroundColor Green
    Write-Host "Starting MongoDB and Redis..." -ForegroundColor Cyan
    docker-compose up -d
    Write-Host "✅ Databases started" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker not running. Using cloud databases from .env" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Starting Backend (Node.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; npm run dev"

Write-Host "🤖 Starting AI Service (Python)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\ai-service'; .\venv\Scripts\activate; python app.py"

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:     http://localhost:5000/health" -ForegroundColor White
Write-Host "📍 AI Service:  http://localhost:5001/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop services" -ForegroundColor Yellow
