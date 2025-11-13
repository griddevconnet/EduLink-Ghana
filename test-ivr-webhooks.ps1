# Test IVR Webhook Handling
# Simulates Africa's Talking webhook calls

$baseUrl = "https://edulink-backend-07ac.onrender.com"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing IVR Webhook Handling" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test incoming call webhook
Write-Host "Step 1: Testing incoming call webhook..." -ForegroundColor Yellow
$incomingBody = @{
    sessionId = "TEST_SESSION_123"
    phoneNumber = "+233244546709"
    isActive = "1"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ivr/incoming" `
        -Method POST `
        -ContentType "application/json" `
        -Body $incomingBody
    
    Write-Host "[OK] Incoming call handled" -ForegroundColor Green
    Write-Host "Response XML:" -ForegroundColor Gray
    Write-Host $response -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 2: Test DTMF input webhook
Write-Host "Step 2: Testing DTMF input (parent presses 1 for 'Sick')..." -ForegroundColor Yellow
$dtmfBody = @{
    sessionId = "TEST_SESSION_123"
    phoneNumber = "+233244546709"
    dtmfDigits = "1"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ivr/dtmf" `
        -Method POST `
        -ContentType "application/json" `
        -Body $dtmfBody
    
    Write-Host "[OK] DTMF processed" -ForegroundColor Green
    Write-Host "Response XML:" -ForegroundColor Gray
    Write-Host $response -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Test call status webhook
Write-Host "Step 3: Testing call status update..." -ForegroundColor Yellow
$statusBody = @{
    sessionId = "TEST_SESSION_123"
    status = "Completed"
    durationInSeconds = 45
    amount = "0.05"
    currencyCode = "USD"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ivr/status" `
        -Method POST `
        -ContentType "application/json" `
        -Body $statusBody
    
    Write-Host "[OK] Call status updated" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IVR Webhook Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Render logs for webhook processing" -ForegroundColor White
Write-Host "2. Verify CallLog was updated in MongoDB" -ForegroundColor White
Write-Host "3. Verify Attendance was updated with reason" -ForegroundColor White
Write-Host ""
