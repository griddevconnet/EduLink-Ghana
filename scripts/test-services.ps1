# EduLink Ghana - Service Health Check Script
# Tests if all services are running correctly

Write-Host "🔍 Testing EduLink Services..." -ForegroundColor Green
Write-Host ""

# Test Backend
Write-Host "Testing Backend (http://localhost:5000/health)..." -ForegroundColor Cyan
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    if ($backend.status -eq "ok") {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
        Write-Host "   Environment: $($backend.environment)" -ForegroundColor Gray
        Write-Host "   Uptime: $([math]::Round($backend.uptime, 2))s" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Backend is not responding" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# Test AI Service
Write-Host "Testing AI Service (http://localhost:5001/health)..." -ForegroundColor Cyan
try {
    $aiService = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    if ($aiService.status -eq "ok") {
        Write-Host "✅ AI Service is healthy" -ForegroundColor Green
        Write-Host "   MongoDB: $($aiService.mongodb)" -ForegroundColor Gray
        Write-Host "   Redis: $($aiService.redis)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ AI Service is not responding" -ForegroundColor Red
    Write-Host "   Make sure AI service is running: cd ai-service && python app.py" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Health check complete!" -ForegroundColor Green
