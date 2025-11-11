# 🔧 EduLink Ghana - Troubleshooting Guide

## **Current Issue: Call Log Loading Error**

### **What You're Seeing:**
```
ERROR  Error loading call logs: [AxiosError: Request failed with status code 404]
```

---

## **✅ Quick Fixes to Try:**

### **1. Refresh the App** (Most Common Fix)
```
1. Close the Expo app completely
2. Restart it with: npm start
3. Press 'r' to reload
4. Navigate to Student Detail → Call Logs
```

### **2. Clear Metro Cache**
```bash
cd teacher-app
npm start -- --reset-cache
```

### **3. Check What the Error Actually Says**

With the latest update, you should now see MORE detailed logs:

```
LOG  Call logs response: {...}
LOG  Extracted call logs: [...]
ERROR Error details: {...}
```

**Look for these patterns:**

#### **Pattern 1: 404 Error**
```
status: 404
message: "Route not found"
```
**Meaning**: Backend route doesn't exist yet  
**Fix**: Wait for Render deployment (5-7 min)

#### **Pattern 2: 401/403 Error**
```
status: 401
message: "Unauthorized"
```
**Meaning**: Authentication issue  
**Fix**: Re-login to the app

#### **Pattern 3: 500 Error**
```
status: 500
message: "Internal server error"
```
**Meaning**: Backend code error  
**Fix**: Check backend logs on Render

#### **Pattern 4: Empty Response**
```
Call logs response: {data: {callLogs: []}}
Extracted call logs: []
```
**Meaning**: No call logs exist yet (this is OK!)  
**Fix**: Add your first call log

---

## **📊 What to Check Next:**

### **Step 1: Check the Console Logs**

After opening Call Log screen, you should see:

```
LOG  Call logs response: {success: true, data: {...}}
LOG  Extracted call logs: []
LOG  Stats response: {totalCalls: 0, ...}
```

**If you see this** → Everything is working! Just no data yet.

### **Step 2: Test Adding a Call Log**

1. Go to Student Detail
2. Tap "Call Logs" button
3. Tap the "+ Add Call" FAB
4. Fill in:
   - Phone: +233123456789
   - Contact Name: Mother
   - Result: Answered
   - Duration: 120
5. Tap "Save"

**Expected Result:**
```
LOG  Call log added successfully
```

### **Step 3: Verify Backend Routes**

Open these URLs in your browser (you'll get "Unauthorized" but that's OK):

```
✅ Should return JSON (not 404):
https://edulink-backend-07ac.onrender.com/api/calls/stats

✅ Should return JSON (not 404):
https://edulink-backend-07ac.onrender.com/api/risk/at-risk
```

**If you get 404** → Backend not deployed yet, wait longer

---

## **🔍 Detailed Debugging Steps:**

### **Check 1: Is Backend Deployed?**

```bash
# Test health endpoint
curl https://edulink-backend-07ac.onrender.com/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","uptime":123}
```

### **Check 2: Are Routes Registered?**

Look at backend logs on Render for:
```
✅ Routes registered: /api/calls
✅ Routes registered: /api/risk
```

### **Check 3: Is Auth Token Valid?**

In the app logs, look for:
```
LOG  🔑 Auth token exists: true
LOG  Authorization: Bearer eyJhbGc...
```

**If token is missing** → Re-login

### **Check 4: What's the Actual Error?**

New logs will show:
```
ERROR Error details: {
  message: "Actual error message here",
  status: 404,
  data: {...}
}
```

---

## **🚨 Common Errors & Solutions:**

### **Error 1: "Request failed with status code 404"**

**Cause**: Route doesn't exist on backend  
**Solution**: 
1. Check Render deployment status
2. Verify routes are in `server.js`
3. Wait for deployment to complete
4. Test route in browser

### **Error 2: "Request failed with status code 401"**

**Cause**: Not authenticated or token expired  
**Solution**:
1. Logout and login again
2. Check token in AsyncStorage
3. Verify JWT hasn't expired (7 days)

### **Error 3: "Request failed with status code 500"**

**Cause**: Backend code error  
**Solution**:
1. Check Render logs for stack trace
2. Look for MongoDB connection issues
3. Verify environment variables

### **Error 4: "Network Error" or "timeout"**

**Cause**: Backend is down or unreachable  
**Solution**:
1. Check internet connection
2. Test health endpoint
3. Check Render service status
4. Wait for cold start (30 seconds)

### **Error 5: Empty array but no error**

**Cause**: No data exists yet (normal!)  
**Solution**:
1. This is expected for new students
2. Add first call log manually
3. Verify it appears in the list

---

## **📱 App-Specific Checks:**

### **For Call Logs:**

**Test Sequence:**
1. Open app → Students tab
2. Select a student
3. Tap "Call Logs" button
4. Watch console for logs
5. Check for errors

**Expected Logs:**
```
LOG  🌐 Making API request to: .../api/calls/student/[id]
LOG  ✅ API Success: GET /api/calls/student/[id]
LOG  Call logs response: {success: true, ...}
LOG  Extracted call logs: []
```

### **For Assessments:**

**Test Sequence:**
1. Open app → Students tab
2. Select a student
3. Tap "Assessments" button
4. Watch console for logs

**Expected Logs:**
```
LOG  🌐 Making API request to: .../api/assessments/student/[id]
LOG  ✅ API Success: GET /api/assessments/student/[id]
LOG  Assessments response: {success: true, ...}
LOG  Extracted assessments: []
```

---

## **🔄 Reset Everything (Nuclear Option):**

If nothing works, try this:

```bash
# 1. Clear Metro cache
cd teacher-app
rm -rf node_modules
npm install
npm start -- --reset-cache

# 2. Clear app data (Android)
# Settings → Apps → Expo Go → Clear Data

# 3. Re-login to the app

# 4. Test again
```

---

## **📞 What to Send for Help:**

If you still have issues, share these logs:

1. **Full console output** from when you open Call Logs
2. **Backend URL test** results:
   ```
   https://edulink-backend-07ac.onrender.com/health
   https://edulink-backend-07ac.onrender.com/api/calls/stats
   ```
3. **Render deployment status** (from dashboard)
4. **Exact error message** from the new detailed logs

---

## **✅ Success Indicators:**

You'll know it's working when you see:

### **Home Screen:**
- ✅ At-risk students section appears (even if empty)
- ✅ No 404 errors in console
- ✅ Stats load correctly

### **Call Logs:**
- ✅ Screen loads without errors
- ✅ Shows "No Call Logs Yet" message
- ✅ Can add new call logs
- ✅ Stats show (0 total calls is OK)

### **Assessments:**
- ✅ Screen loads without errors
- ✅ Shows "No Assessments Yet" message
- ✅ Can add new assessments
- ✅ Latest assessment card appears after adding

---

## **🎯 Next Steps:**

1. **Reload your app** with the new error handling
2. **Check the detailed logs** to see the actual error
3. **Share the logs** if you need help
4. **Test adding data** to verify write operations work

The new logging will tell us exactly what's wrong!

---

*Last Updated: November 10, 2025 - 7:40 PM UTC*
