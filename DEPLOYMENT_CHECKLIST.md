# 🚀 Deployment Checklist - Automated Calling System

## **Prerequisites**

Before deploying the automated calling system, ensure you have:

- ✅ Backend deployed on Render.com
- ✅ MongoDB database connected
- ✅ Africa's Talking account with credits
- ✅ API credentials configured

---

## **Step 1: Install Dependencies**

### **On Render (Automatic):**
The `package.json` already includes `node-cron`. Render will install it automatically on next deployment.

### **Local Testing:**
```bash
cd backend
npm install
```

This will install:
- `node-cron@^3.0.3` - For scheduled tasks

---

## **Step 2: Configure Environment Variables**

### **On Render Dashboard:**

Go to your backend service → Environment → Add these variables:

```env
# Africa's Talking API (Required)
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=your_sender_id

# Optional: Customize schedule
AUTO_CALL_HOUR=16  # Default: 4 PM
AUTO_CALL_TIMEZONE=Africa/Accra  # Default: Ghana timezone

# MongoDB (Already configured)
MONGODB_URI=your_mongodb_connection_string

# JWT (Already configured)
JWT_SECRET=your_jwt_secret
```

---

## **Step 3: Deploy Backend**

### **Automatic Deployment:**
```bash
git push origin main
```

Render will automatically:
1. Detect changes
2. Install dependencies (including node-cron)
3. Build the app
4. Start the server
5. Initialize cron jobs

### **Verify Deployment:**

Check logs on Render for these messages:
```
✅ MongoDB connected successfully
⏰ Automated call scheduler initialized
📅 End-of-day processing: 4:00 PM weekdays
🔄 Retry processing: Every 30 minutes (8 AM - 6 PM)
🚀 EduLink Backend running on port 5000
```

---

## **Step 4: Test the System**

### **Test 1: Check Follow-Up Detection**

1. **Mark a student absent:**
   ```
   Mobile App → Attendance → Mark student absent → Save
   ```

2. **Check Follow-Up Queue:**
   ```
   Mobile App → Home → Follow-Up Queue
   ```
   
   **Expected**: Student should appear in the queue

3. **Verify API:**
   ```bash
   curl https://edulink-backend-07ac.onrender.com/api/attendance/follow-up \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected**: JSON response with absent students

### **Test 2: Manual Trigger (Testing Only)**

```bash
curl -X POST https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 0,
    "skipped": 1
  }
}
```

### **Test 3: Check Call Logs**

```bash
curl https://edulink-backend-07ac.onrender.com/api/calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Stats showing automated calls

### **Test 4: Verify Cron Schedule**

Check Render logs around 4:00 PM (Ghana time):
```
⏰ Cron: Starting end-of-day follow-up processing...
Found 3 students needing follow-up calls
📞 Initiating automated call for Kofi Amedzie
✅ Call initiated successfully for Kofi
🎉 End-of-day follow-up processing complete
```

---

## **Step 5: Monitor & Verify**

### **Daily Monitoring:**

**Morning (9 AM):**
- Check yesterday's call statistics
- Review any failed calls
- Verify all absences were contacted

**Afternoon (4:30 PM):**
- Check if cron job ran
- Review automated call results
- Check for any errors in logs

### **Weekly Review:**

**Metrics to Track:**
```bash
# Get statistics
curl https://edulink-backend-07ac.onrender.com/api/auto-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Track:
- Total absences per week
- Manual call rate (teacher-initiated)
- Automated call rate (AI-initiated)
- Success rate (answered vs no answer)
- Parent response patterns

---

## **Step 6: Africa's Talking Setup**

### **Configure Webhooks:**

In your Africa's Talking dashboard:

1. **Voice Callback URL:**
   ```
   https://edulink-backend-07ac.onrender.com/api/ivr/incoming
   ```

2. **DTMF Callback URL:**
   ```
   https://edulink-backend-07ac.onrender.com/api/ivr/dtmf
   ```

3. **Status Callback URL:**
   ```
   https://edulink-backend-07ac.onrender.com/api/ivr/status
   ```

### **Test Voice Call:**

Use Africa's Talking simulator:
1. Go to Voice → Simulator
2. Enter test phone number
3. Initiate call
4. Verify IVR plays correctly
5. Test DTMF input (press 1, 2, etc.)

---

## **Troubleshooting**

### **Issue 1: Cron Jobs Not Running**

**Symptoms:**
- No automated calls at 4 PM
- No logs showing cron execution

**Solutions:**
1. Check Render logs for initialization message
2. Verify timezone setting
3. Check if server restarted around 4 PM
4. Manual trigger to test functionality

**Debug:**
```bash
# Check if routes are registered
curl https://edulink-backend-07ac.onrender.com/api/auto-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Issue 2: Follow-Up Queue Empty**

**Symptoms:**
- Students marked absent but don't appear in queue

**Solutions:**
1. Check `followUpRequired` flag in database
2. Verify attendance status is "absent" (not "excused")
3. Check if `followUpCompleted` is false
4. Review Attendance model logic

**Debug:**
```javascript
// In MongoDB
db.attendances.find({
  date: ISODate("2025-11-11"),
  status: "absent",
  followUpRequired: true,
  followUpCompleted: false
})
```

### **Issue 3: Calls Failing**

**Symptoms:**
- Automated calls initiated but fail
- High failure rate

**Solutions:**
1. Check Africa's Talking balance
2. Verify phone number format (+233...)
3. Check API credentials
4. Review error logs

**Debug:**
```bash
# Check call logs
curl https://edulink-backend-07ac.onrender.com/api/calls?result=failed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## **Production Checklist**

### **Before Going Live:**

- [ ] Backend deployed and running
- [ ] MongoDB connected
- [ ] Africa's Talking configured
- [ ] Webhooks set up
- [ ] Environment variables configured
- [ ] Cron jobs initialized
- [ ] Test calls successful
- [ ] Follow-up queue working
- [ ] Manual trigger tested
- [ ] Stats endpoint working
- [ ] Error handling tested
- [ ] Logs reviewed
- [ ] Documentation shared with team

### **After Going Live:**

- [ ] Monitor first automated call cycle (4 PM)
- [ ] Review call success rate
- [ ] Check parent feedback
- [ ] Verify all absences contacted
- [ ] Document any issues
- [ ] Train teachers on system
- [ ] Set up daily monitoring routine

---

## **Maintenance**

### **Daily Tasks:**
- Check call statistics
- Review failed calls
- Monitor Africa's Talking balance
- Check error logs

### **Weekly Tasks:**
- Review success rates
- Analyze parent response patterns
- Update contact information
- Test manual triggers

### **Monthly Tasks:**
- Review overall metrics
- Optimize call timing if needed
- Update IVR messages if needed
- Train new teachers

---

## **Rollback Plan**

If automated calling causes issues:

### **Option 1: Disable Cron Jobs**

Edit `server.js`:
```javascript
// Comment out cron initialization
// const { initializeCronJobs } = require('./services/cronScheduler');
// initializeCronJobs();
```

Redeploy.

### **Option 2: Change Schedule**

Set environment variable:
```env
AUTO_CALL_HOUR=23  # 11 PM (effectively disables during school day)
```

### **Option 3: Manual Mode Only**

Teachers can still use manual calling. Automated calls won't run but system remains functional.

---

## **Support Contacts**

### **Technical Issues:**
- Backend logs: Render dashboard
- Database: MongoDB Atlas dashboard
- Calling: Africa's Talking support

### **Configuration:**
- Environment variables: Render dashboard
- Cron schedule: `backend/src/services/cronScheduler.js`
- Call logic: `backend/src/services/autoCallScheduler.js`

---

## **Success Indicators**

You'll know it's working when:

✅ Students appear in follow-up queue after marking absent  
✅ Cron job runs at 4 PM daily (check logs)  
✅ Automated calls are initiated  
✅ Call logs show "africastalking" provider  
✅ Parents receive calls and respond  
✅ DTMF input is captured  
✅ Follow-ups are marked complete  
✅ Statistics show 100% contact rate  

---

## **Next Steps**

After successful deployment:

1. **Week 1**: Monitor closely, fix any issues
2. **Week 2**: Gather teacher feedback
3. **Week 3**: Analyze parent response patterns
4. **Week 4**: Optimize timing and messages
5. **Month 2+**: Scale to more schools

---

**Deployment Status**: Ready to Deploy  
**Estimated Setup Time**: 30 minutes  
**Testing Time**: 1 hour  
**Go-Live**: After successful testing

---

**Good luck with your deployment!** 🚀
