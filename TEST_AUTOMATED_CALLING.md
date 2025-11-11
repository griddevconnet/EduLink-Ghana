# 🧪 Test Automated Calling System

## **Prerequisites**

Before testing, make sure:
1. ✅ Backend is deployed on Render
2. ✅ Kofi is marked as absent (followUpRequired: true)
3. ✅ Africa's Talking credentials are set in Render environment variables
4. ✅ You have your auth token

---

## **Option 1: Manual API Trigger** (RECOMMENDED)

This triggers the automated calling immediately without waiting for 4 PM.

### **Step 1: Get Your Auth Token**

From the mobile app logs, copy your token:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU
```

### **Step 2: Trigger Follow-Up Processing**

**Using PowerShell:**
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups" -Method POST -Headers $headers
```

**Using curl (Git Bash or WSL):**
```bash
curl -X POST https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU" \
  -H "Content-Type: application/json"
```

**Using Postman:**
```
Method: POST
URL: https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
```

### **Step 3: Check Response**

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Follow-up processing completed",
  "data": {
    "totalProcessed": 1,
    "successfulCalls": 1,
    "failedCalls": 0,
    "skipped": 0,
    "details": [
      {
        "student": "Kofi Amedzie",
        "phone": "+233244546709",
        "status": "success",
        "callId": "ATXid_..."
      }
    ]
  }
}
```

**If No Students Need Follow-Up:**
```json
{
  "success": true,
  "message": "Follow-up processing completed",
  "data": {
    "totalProcessed": 0,
    "successfulCalls": 0,
    "failedCalls": 0,
    "skipped": 0,
    "details": []
  }
}
```

---

## **Option 2: Check Follow-Up Stats**

See what students need follow-up calls:

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "https://edulink-backend-07ac.onrender.com/api/auto-calls/stats" -Method GET -Headers $headers
```

**curl:**
```bash
curl https://edulink-backend-07ac.onrender.com/api/auto-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "pendingFollowUps": 1,
    "completedToday": 0,
    "failedCallsToday": 0,
    "students": [
      {
        "studentId": "690e244bb66a8103cbc1494d",
        "studentName": "Kofi Amedzie",
        "absentDate": "2025-11-11",
        "parentPhone": "+233244546709",
        "parentName": "Angelina Kplivi",
        "followUpRequired": true,
        "callTriggered": false
      }
    ]
  }
}
```

---

## **Option 3: Wait for Scheduled Time**

The automated system runs at 4:00 PM daily.

### **What Happens:**
1. **4:00 PM** - Cron job triggers
2. **System checks** for students with `followUpRequired: true` and `callTriggered: false`
3. **Finds Kofi** (if not already called)
4. **Calls parent**: +233244546709
5. **IVR plays**: "Hello, this is EduLink calling about Kofi Amedzie..."
6. **Parent presses key** (1-9)
7. **Call logged** automatically
8. **Follow-up marked complete**

### **Check Render Logs:**
```
1. Go to https://dashboard.render.com
2. Open your backend service
3. Click "Logs" tab
4. Look for:
   - "⏰ Running end-of-day follow-up processing..."
   - "📞 Processing follow-ups for 1 students"
   - "✅ Call initiated for Kofi Amedzie"
```

---

## **Option 4: Test with Postman Collection**

I can create a Postman collection if you prefer a GUI.

---

## **What to Expect:**

### **When Call is Triggered:**

1. **Backend logs:**
```
📞 Processing follow-ups for 1 students
🔍 Student: Kofi Amedzie (690e244bb66a8103cbc1494d)
📱 Calling parent: +233244546709 (Angelina Kplivi)
⏳ Waiting 2 seconds before next call...
✅ Call initiated for Kofi Amedzie
📊 Follow-up processing complete: 1 successful, 0 failed
```

2. **Parent's phone rings:**
   - Caller ID shows Africa's Talking number
   - IVR message plays in Twi (parent's preferred language)
   - Parent presses a key (1-9)

3. **Database updated:**
   - `callTriggered: true`
   - `followUpCompleted: true`
   - New `CallLog` record created

4. **Follow-up queue:**
   - Kofi removed from queue
   - Stats updated

---

## **Troubleshooting:**

### **Error: "No students need follow-up"**

**Cause:** Kofi's record still has `followUpRequired: false`

**Fix:**
1. Delete old attendance record
2. Re-mark Kofi as absent
3. Save
4. Try again

### **Error: "Africa's Talking credentials not configured"**

**Cause:** Environment variables missing

**Fix:**
1. Go to Render dashboard
2. Environment → Add variables:
   - `AFRICASTALKING_USERNAME`
   - `AFRICASTALKING_API_KEY`
   - `AFRICASTALKING_SENDER_ID`
3. Redeploy

### **Error: "Call failed"**

**Possible causes:**
- Invalid phone number
- Africa's Talking account issue
- Network error

**Check:**
1. Render logs for error details
2. Africa's Talking dashboard for call status
3. Phone number format (+233...)

---

## **Verification Steps:**

After triggering the call:

### **1. Check Call Logs in Database**
```javascript
// In MongoDB Atlas
db.calllogs.find({ student: ObjectId("690e244bb66a8103cbc1494d") })
```

**Expected:**
```json
{
  "_id": "...",
  "student": "690e244bb66a8103cbc1494d",
  "school": "690e170dbbdd991d0e263979",
  "callType": "absence_followup",
  "phoneNumber": "+233244546709",
  "contactName": "Angelina Kplivi",
  "status": "completed",
  "duration": 45,
  "outcome": "parent_responded",
  "languageDetected": "tw",
  "dtmfInput": "5",
  "automated": true,
  "createdAt": "2025-11-11T18:30:00.000Z"
}
```

### **2. Check Attendance Record**
```javascript
db.attendances.findOne({ _id: ObjectId("691354a82ae9c2ce2903fc06") })
```

**Expected:**
```json
{
  "_id": "691354a82ae9c2ce2903fc06",
  "student": "690e244bb66a8103cbc1494d",
  "status": "absent",
  "followUpRequired": true,
  "followUpCompleted": true,
  "callTriggered": true
}
```

### **3. Check Follow-Up Queue**
```
Mobile App → Follow-Up Queue
Should be empty or not show Kofi
```

### **4. Check Africa's Talking Dashboard**
```
1. Go to https://account.africastalking.com
2. Click "Voice" → "Call Logs"
3. Look for call to +233244546709
4. Status should be "Completed"
```

---

## **Quick Test Script**

Save this as `test-auto-calls.ps1`:

```powershell
# Test Automated Calling System

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU"
$baseUrl = "https://edulink-backend-07ac.onrender.com"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing Automated Calling System" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check stats
Write-Host "📊 Step 1: Checking follow-up stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/auto-calls/stats" -Method GET -Headers $headers
    Write-Host "✅ Stats retrieved successfully" -ForegroundColor Green
    Write-Host "Pending follow-ups: $($stats.data.pendingFollowUps)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get stats: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Trigger follow-up processing
Write-Host "📞 Step 2: Triggering follow-up processing..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/auto-calls/process-followups" -Method POST -Headers $headers
    Write-Host "✅ Processing completed successfully" -ForegroundColor Green
    Write-Host "Total processed: $($result.data.totalProcessed)" -ForegroundColor White
    Write-Host "Successful calls: $($result.data.successfulCalls)" -ForegroundColor Green
    Write-Host "Failed calls: $($result.data.failedCalls)" -ForegroundColor Red
    Write-Host ""
    
    if ($result.data.details.Count -gt 0) {
        Write-Host "📋 Call Details:" -ForegroundColor Cyan
        foreach ($detail in $result.data.details) {
            Write-Host "  - Student: $($detail.student)" -ForegroundColor White
            Write-Host "    Phone: $($detail.phone)" -ForegroundColor White
            Write-Host "    Status: $($detail.status)" -ForegroundColor $(if ($detail.status -eq "success") { "Green" } else { "Red" })
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Failed to process follow-ups: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Test completed!" -ForegroundColor Green
```

**Run it:**
```powershell
cd C:\Users\damed\Desktop\EduLink
.\test-auto-calls.ps1
```

---

## **Summary:**

**To test automated calling NOW:**

1. **Quick Test:**
   ```powershell
   # Copy-paste this in PowerShell
   $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBkZjY3ZTA5ODM1NDdlYWJjNDFkMWIiLCJyb2xlIjoidGVhY2hlciIsInBob25lIjoiKzIzMzU0MjcyMjcyMCIsInNjaG9vbCI6IjY5MGUxNzBkYmJkZDk5MWQwZTI2Mzk3OSIsImlhdCI6MTc2Mjc2MzM3MiwiZXhwIjoxNzYzMzY4MTcyfQ.GsNgkMP4aRRiKoB-Z0eNxJzRGEoyhe6_xxI3Z-BYgbU"
   
   Invoke-RestMethod -Uri "https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"}
   ```

2. **What happens:**
   - System finds Kofi (absent, needs follow-up)
   - Calls parent: +233244546709
   - IVR plays message
   - Parent responds
   - Call logged
   - Follow-up marked complete

3. **Verify:**
   - Check response for success
   - Check Render logs
   - Check mobile app follow-up queue
   - Check Africa's Talking dashboard

**Ready to test?** 🚀
