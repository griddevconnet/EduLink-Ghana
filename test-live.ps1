# EduLink Live API Testing Script
Write-Host "Testing EduLink Live APIs" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://edulink-backend-07ac.onrender.com"
$AI_URL = "https://edulink-ai-service.onrender.com"

# Test 1: Backend Health
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "SUCCESS - Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Backend health check failed!" -ForegroundColor Red
}
Write-Host ""

# Test 2: AI Service Health
Write-Host "2. Testing AI Service Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$AI_URL/health" -Method Get
    Write-Host "SUCCESS - AI Service is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - AI Service health check failed!" -ForegroundColor Red
}
Write-Host ""

# Test 3: Language Detection
Write-Host "3. Testing Language Detection..." -ForegroundColor Yellow
$langBody = @{
    text = "Meda wo akye"
    phone = "+233241234567"
    region = "Ashanti"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$AI_URL/ai/detect-language" -Method Post -Body $langBody -ContentType "application/json"
    Write-Host "SUCCESS - Language detected!" -ForegroundColor Green
    Write-Host "   Language: $($response.language)" -ForegroundColor Gray
    Write-Host "   Confidence: $($response.confidence)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Language detection failed!" -ForegroundColor Red
}
Write-Host ""

# Test 4: Risk Scoring
Write-Host "4. Testing Risk Scoring..." -ForegroundColor Yellow
$riskBody = @{
    features = @{
        absences30Days = 12
        attendanceRate30Days = 60
        literacyLevel = "below_benchmark"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$AI_URL/ai/score-risk" -Method Post -Body $riskBody -ContentType "application/json"
    Write-Host "SUCCESS - Risk score calculated!" -ForegroundColor Green
    Write-Host "   Risk Score: $($response.riskScore)" -ForegroundColor Gray
    Write-Host "   Risk Level: $($response.riskLevel)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Risk scoring failed!" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Live URLs:" -ForegroundColor Yellow
Write-Host "Backend:    $BACKEND_URL" -ForegroundColor White
Write-Host "AI Service: $AI_URL" -ForegroundColor White
Write-Host ""
