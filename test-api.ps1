# EduLink API Test Script
# PowerShell script to test all endpoints

Write-Host "🧪 EduLink API Testing Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_URL = "http://localhost:5000"
$AI_URL = "http://localhost:5001"

# Test 1: Backend Health Check
Write-Host "1️⃣  Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "✅ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   MongoDB: $($response.mongodb)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend && npm start" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: AI Service Health Check
Write-Host "2️⃣  Testing AI Service Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$AI_URL/health" -Method Get
    Write-Host "✅ AI Service is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   MongoDB: $($response.mongodb)" -ForegroundColor Gray
} catch {
    Write-Host "❌ AI Service health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Make sure AI service is running: cd ai-service && python app.py" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Register User
Write-Host "3️⃣  Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    firstName = "Test"
    lastName = "User"
    email = "test@edulink.gh"
    password = "TestPassword123!"
    phone = "+233241234567"
    role = "teacher"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    Write-Host "   User: $($response.data.user.firstName) $($response.data.user.lastName)" -ForegroundColor Gray
    Write-Host "   Email: $($response.data.user.email)" -ForegroundColor Gray
    $global:token = $response.data.token
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️  User already exists (this is OK)" -ForegroundColor Yellow
        # Try to login instead
        Write-Host "   Attempting login..." -ForegroundColor Gray
        $loginBody = @{
            email = "test@edulink.gh"
            password = "TestPassword123!"
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
            Write-Host "✅ Logged in successfully!" -ForegroundColor Green
            $global:token = $response.data.token
        } catch {
            Write-Host "❌ Login failed!" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Registration failed!" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Create School (requires token)
if ($global:token) {
    Write-Host "4️⃣  Testing School Creation..." -ForegroundColor Yellow
    $schoolBody = @{
        name = "Test Primary School"
        region = "Greater Accra"
        district = "Accra Metro"
        type = "Primary"
        ownership = "Public"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $global:token"
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/schools" -Method Post -Body $schoolBody -Headers $headers
        Write-Host "✅ School created successfully!" -ForegroundColor Green
        Write-Host "   Name: $($response.data.name)" -ForegroundColor Gray
        Write-Host "   Region: $($response.data.region)" -ForegroundColor Gray
        $global:schoolId = $response.data._id
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "⚠️  School might already exist (this is OK)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ School creation failed!" -ForegroundColor Red
            Write-Host "   Error: $_" -ForegroundColor Red
        }
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping school creation (no token)" -ForegroundColor Gray
    Write-Host ""
}

# Test 5: Language Detection
Write-Host "5️⃣  Testing Language Detection..." -ForegroundColor Yellow
$langBody = @{
    text = "Meda wo akye"
    phone = "+233241234567"
    region = "Ashanti"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$AI_URL/ai/detect-language" -Method Post -Body $langBody -ContentType "application/json"
    Write-Host "✅ Language detected!" -ForegroundColor Green
    Write-Host "   Language: $($response.language)" -ForegroundColor Gray
    Write-Host "   Confidence: $($response.confidence)" -ForegroundColor Gray
    Write-Host "   Method: $($response.method)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Language detection failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Risk Scoring
Write-Host "6️⃣  Testing Risk Scoring..." -ForegroundColor Yellow
$riskBody = @{
    features = @{
        absences30Days = 12
        attendanceRate30Days = 60
        literacyLevel = "below_benchmark"
        numeracyLevel = "meeting_benchmark"
        contactVerified = $false
        hasDisability = $false
        locationType = "Rural"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$AI_URL/ai/score-risk" -Method Post -Body $riskBody -ContentType "application/json"
    Write-Host "✅ Risk score calculated!" -ForegroundColor Green
    Write-Host "   Risk Score: $($response.riskScore)" -ForegroundColor Gray
    Write-Host "   Risk Level: $($response.riskLevel)" -ForegroundColor Gray
    Write-Host "   Recommendations: $($response.recommendations -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Risk scoring failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check MongoDB for created data" -ForegroundColor White
Write-Host "2. Test more endpoints with Postman" -ForegroundColor White
Write-Host "3. Review API documentation" -ForegroundColor White
Write-Host "4. Set up Africa's Talking for IVR/SMS" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- API Docs: backend/API_DOCUMENTATION.md" -ForegroundColor White
Write-Host "- Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "- Test Setup: TEST_SETUP.md" -ForegroundColor White
Write-Host ""
