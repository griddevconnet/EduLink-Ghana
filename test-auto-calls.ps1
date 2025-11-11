# Test Automated Calling System
# Run this script to manually trigger automated follow-up calls

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU"
$baseUrl = "https://edulink-backend-07ac.onrender.com"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Automated Calling System     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend health
Write-Host "Step 1: Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "[OK] Backend is online" -ForegroundColor Green
    Write-Host "     Uptime: $($health.uptime) seconds" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Backend is offline: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Check follow-up stats
Write-Host "Step 2: Checking follow-up stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/auto-calls/stats" -Method GET -Headers $headers
    Write-Host "[OK] Stats retrieved successfully" -ForegroundColor Green
    Write-Host "     Pending follow-ups: $($stats.data.pendingFollowUps)" -ForegroundColor White
    Write-Host "     Completed today: $($stats.data.completedToday)" -ForegroundColor White
    Write-Host "     Failed calls today: $($stats.data.failedCallsToday)" -ForegroundColor White
    Write-Host ""
    
    if ($stats.data.students -and $stats.data.students.Count -gt 0) {
        Write-Host "     Students needing follow-up:" -ForegroundColor Cyan
        foreach ($student in $stats.data.students) {
            Write-Host "       - $($student.studentName)" -ForegroundColor White
            Write-Host "         Phone: $($student.parentPhone)" -ForegroundColor Gray
            Write-Host "         Absent: $($student.absentDate)" -ForegroundColor Gray
        }
        Write-Host ""
    } else {
        Write-Host "     No students currently need follow-up" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "[ERROR] Failed to get stats: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "        This might mean the auto-calls routes are not registered yet" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Ask user if they want to proceed
Write-Host "Step 3: Trigger automated calls?" -ForegroundColor Yellow
Write-Host "        This will call parents of absent students NOW" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "        Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host ""
    Write-Host "[CANCELLED] Test cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Triggering follow-up processing..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/auto-calls/process-followups" -Method POST -Headers $headers
    Write-Host "[OK] Processing completed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "     Results:" -ForegroundColor Cyan
    Write-Host "       Total processed: $($result.data.totalProcessed)" -ForegroundColor White
    Write-Host "       Successful calls: $($result.data.successfulCalls)" -ForegroundColor Green
    Write-Host "       Failed calls: $($result.data.failedCalls)" -ForegroundColor Red
    Write-Host "       Skipped: $($result.data.skipped)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($result.data.details -and $result.data.details.Count -gt 0) {
        Write-Host "     Call Details:" -ForegroundColor Cyan
        foreach ($detail in $result.data.details) {
            if ($detail.status -eq "success") {
                $statusColor = "Green"
                $statusIcon = "[OK]"
            } else {
                $statusColor = "Red"
                $statusIcon = "[FAIL]"
            }
            
            Write-Host "       $statusIcon Student: $($detail.student)" -ForegroundColor White
            Write-Host "            Phone: $($detail.phone)" -ForegroundColor Gray
            Write-Host "            Status: $($detail.status)" -ForegroundColor $statusColor
            if ($detail.callId) {
                Write-Host "            Call ID: $($detail.callId)" -ForegroundColor Gray
            }
            if ($detail.error) {
                Write-Host "            Error: $($detail.error)" -ForegroundColor Red
            }
            Write-Host ""
        }
    }
} catch {
    Write-Host "[ERROR] Failed to process follow-ups" -ForegroundColor Red
    Write-Host "        Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "        Response: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "        Could not read error response" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Test completed successfully!         " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Render logs for call details" -ForegroundColor White
Write-Host "2. Check Africa's Talking dashboard for call status" -ForegroundColor White
Write-Host "3. Check mobile app follow-up queue (should be updated)" -ForegroundColor White
Write-Host "4. Check MongoDB for new CallLog records" -ForegroundColor White
Write-Host ""
