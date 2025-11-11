# 🤖 Automated AI Calling System - EduLink Ghana

## **Overview**

The automated calling system ensures **100% parent contact** for absent students by combining teacher-initiated calls with AI-powered automated calls.

---

## **How It Works**

### **The Complete Workflow:**

```
MORNING (8:00 AM - 4:00 PM)
├─ 1. Teacher marks student absent
├─ 2. Student appears in Follow-Up Queue
├─ 3. Teacher can call parent manually anytime
│     ├─ Tap phone icon → Make real call
│     └─ Log call details
│
END OF DAY (4:00 PM)
├─ 4. Automated system activates
├─ 5. Checks for uncalled absences
├─ 6. For each uncalled student:
│     ├─ Skip if teacher already called
│     ├─ Get parent phone number
│     ├─ Initiate AI call via IVR
│     ├─ Play multilingual message
│     ├─ Capture DTMF input (reason)
│     └─ Log call automatically
│
RESULT
└─ 7. 100% of absent students' parents contacted
```

---

## **Teacher's Perspective**

### **What Teachers Do:**

**Option 1: Call During the Day** (Recommended)
```
1. Mark student absent
2. See student in Follow-Up Queue
3. Tap phone icon to call parent
4. Discuss absence
5. Log call details
✅ Done! AI won't call this parent
```

**Option 2: Let AI Handle It**
```
1. Mark student absent
2. Don't call (too busy, no time, etc.)
3. At 4 PM: AI calls automatically
4. Parent responds via phone keypad
5. Call logged automatically
✅ Done! Parent was contacted
```

### **Key Points:**
- ✅ Teachers have **full control** until 4 PM
- ✅ Manual calls **always take priority**
- ✅ AI only calls **uncalled absences**
- ✅ All calls are **logged and tracked**

---

## **AI Calling System**

### **When AI Calls Activate:**

**Schedule:**
- **Time**: 4:00 PM daily
- **Days**: Monday - Friday (weekdays only)
- **Timezone**: Africa/Accra (Ghana)

**Conditions:**
- Student marked absent today
- No manual call logged by teacher
- Parent contact information available
- Follow-up not yet completed

### **What Happens During AI Call:**

```
1. CALL INITIATED
   └─ System dials parent's phone number

2. PARENT ANSWERS
   └─ IVR plays message in their language

3. MESSAGE CONTENT (Example - English):
   "Hello. This is [School Name]. [Child Name] was absent 
   from school today. Press 1 if sick, 2 if traveling, 
   3 if working, 4 for family emergency, 5 for other reason, 
   or 9 to speak to a teacher."

4. PARENT PRESSES KEY
   └─ System captures reason

5. CALL LOGGED
   └─ Automatically saved to database

6. FOLLOW-UP MARKED COMPLETE
   └─ Student removed from queue
```

### **Supported Languages:**
- 🇬🇧 **English**
- 🇬🇭 **Twi**
- 🇬🇭 **Ga**

Language detected from parent's phone prefix or preference.

---

## **DTMF Input Codes**

Parents respond by pressing keys on their phone:

| Key | Meaning | Action |
|-----|---------|--------|
| **1** | Student is sick | Logged as "sick" |
| **2** | Student is traveling | Logged as "travel" |
| **3** | Student is working | Logged as "work" |
| **4** | Family emergency | Logged as "family_emergency" |
| **5** | Other reason | Logged as "other" |
| **9** | Want to speak to teacher | Offers voice recording |

---

## **Follow-Up Queue**

### **How to Access:**
```
Home Screen → "Follow-Up Queue" button
```

### **What You See:**

```
┌─────────────────────────────────────┐
│  📋 Follow-Up Queue                 │
├─────────────────────────────────────┤
│  🔴 HIGH PRIORITY (3)               │
│  ├─ Kofi Amedzie                    │
│  │  Absent today • No call yet      │
│  │  [Call Now] [Mark Complete]      │
│  │                                   │
│  ├─ Ama Mensah                      │
│  │  Absent today • No call yet      │
│  │  [Call Now] [Mark Complete]      │
│  │                                   │
│  └─ Kwame Boateng                   │
│     Absent today • No call yet      │
│     [Call Now] [Mark Complete]      │
├─────────────────────────────────────┤
│  🟡 MEDIUM PRIORITY (2)             │
│  └─ ...                             │
├─────────────────────────────────────┤
│  🟢 LOW PRIORITY (1)                │
│  └─ ...                             │
└─────────────────────────────────────┘
```

### **Priority Levels:**
- **🔴 High**: Absent today, no call yet, 4 PM approaching
- **🟡 Medium**: Absent today, call attempted but failed
- **🟢 Low**: Absent yesterday, follow-up pending

---

## **Automated Call Statistics**

### **API Endpoint:**
```
GET /api/auto-calls/stats
```

### **Response:**
```json
{
  "totalAbsences": 10,
  "followUpRequired": 10,
  "followUpCompleted": 3,
  "callTriggered": 5,
  "pending": 2
}
```

### **What It Means:**
- **totalAbsences**: Students absent today
- **followUpRequired**: Need parent contact
- **followUpCompleted**: Teacher called manually
- **callTriggered**: AI called automatically
- **pending**: Still need calls (before 4 PM)

---

## **Manual Triggers**

Headteachers and admins can manually trigger automated calls:

### **Trigger End-of-Day Processing:**
```
POST /api/auto-calls/process-followups
Authorization: Bearer <token>
```

**Use Case**: Test the system or run early

### **Trigger Retry Processing:**
```
POST /api/auto-calls/process-retries
Authorization: Bearer <token>
```

**Use Case**: Retry failed calls immediately

---

## **Retry Logic**

### **When Calls Fail:**

If a call fails (no answer, busy, network error):

1. **First Attempt**: 4:00 PM (end of day)
2. **Second Attempt**: 4:30 PM (30 min later)
3. **Third Attempt**: 5:00 PM (30 min later)
4. **Max Attempts**: 3 total

### **Retry Schedule:**
- Runs every 30 minutes
- Between 8 AM - 6 PM
- Monday - Friday only
- Automatic retry for:
  - No answer
  - Busy signal
  - Failed connection

---

## **Call Logging**

### **Automated Calls Are Logged With:**

- ✅ **Student**: Who was absent
- ✅ **Phone**: Parent's number
- ✅ **Contact Name**: Parent's name
- ✅ **Result**: answered, no_answer, busy, failed
- ✅ **Duration**: Call length in seconds
- ✅ **DTMF Input**: Key pressed (1-9)
- ✅ **DTMF Meaning**: Reason (sick, travel, etc.)
- ✅ **Provider**: "africastalking"
- ✅ **Timestamp**: When call was made
- ✅ **Attempt Number**: 1st, 2nd, or 3rd try

### **View Automated Calls:**
```
Students → Select Student → Call Logs

Filter by:
- Provider: "africastalking" (automated)
- Provider: "manual" (teacher-initiated)
```

---

## **Technical Architecture**

### **Components:**

```
┌─────────────────────────────────────┐
│  1. ATTENDANCE SYSTEM               │
│     └─ Marks student absent         │
│        └─ Sets followUpRequired     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. FOLLOW-UP QUEUE                 │
│     └─ Shows pending follow-ups     │
│        └─ Teachers can call         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. CRON SCHEDULER (4 PM)           │
│     └─ Checks uncalled absences     │
│        └─ Triggers AI calls         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. AUTO CALL SCHEDULER             │
│     └─ Gets student & parent info   │
│        └─ Initiates IVR call        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. CALL SERVICE                    │
│     └─ Makes call via Africa's      │
│        Talking API                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  6. IVR SYSTEM                      │
│     └─ Plays message                │
│        └─ Captures DTMF             │
│           └─ Logs result            │
└─────────────────────────────────────┘
```

### **Files:**
- `models/Attendance.js` - Follow-up tracking
- `services/autoCallScheduler.js` - Main logic
- `services/cronScheduler.js` - Scheduling
- `services/callService.js` - IVR integration
- `controllers/autoCallController.js` - API endpoints
- `routes/autoCalls.js` - API routes

---

## **Configuration**

### **Environment Variables:**

```env
# Africa's Talking API
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=your_sender_id

# Optional: Override default schedule
AUTO_CALL_HOUR=16  # 4 PM (default)
AUTO_CALL_TIMEZONE=Africa/Accra  # Ghana timezone
```

### **Cron Schedule:**

**End-of-Day Processing:**
```javascript
'0 16 * * 1-5'  // 4:00 PM, Monday-Friday
```

**Retry Processing:**
```javascript
'*/30 8-18 * * 1-5'  // Every 30 min, 8 AM-6 PM, weekdays
```

---

## **Testing**

### **Test the System:**

**1. Mark Student Absent:**
```
Attendance → Mark Kofi absent → Save
```

**2. Check Follow-Up Queue:**
```
Home → Follow-Up Queue
→ Should see Kofi in the list
```

**3. Don't Call Manually**
(Let AI handle it)

**4. Manually Trigger (For Testing):**
```bash
curl -X POST https://edulink-backend-07ac.onrender.com/api/auto-calls/process-followups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**5. Check Call Logs:**
```
Students → Kofi → Call Logs
→ Should see automated call
→ Provider: "africastalking"
```

**6. Check Stats:**
```bash
curl https://edulink-backend-07ac.onrender.com/api/auto-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## **Best Practices**

### **For Teachers:**

1. **✅ Call During the Day**
   - Better to call personally when possible
   - More detailed conversation
   - Build parent relationships

2. **✅ Let AI Handle Overflow**
   - When too busy
   - When parent doesn't answer
   - For routine absences

3. **✅ Review AI Call Logs**
   - Check what parents said
   - Follow up on concerning responses
   - Complete any needed actions

### **For Administrators:**

1. **✅ Monitor Stats Daily**
   - Check follow-up completion rate
   - Review AI call success rate
   - Identify patterns

2. **✅ Test Regularly**
   - Manual trigger once a week
   - Verify calls are working
   - Check parent feedback

3. **✅ Update Contact Info**
   - Keep parent phones current
   - Verify language preferences
   - Remove invalid numbers

---

## **Troubleshooting**

### **Problem: Follow-Up Queue Empty**

**Possible Causes:**
- No students marked absent today
- All absences already followed up
- Follow-up logic not triggering

**Solution:**
1. Check attendance records for today
2. Verify students marked "absent" (not "excused")
3. Check `followUpRequired` flag in database

### **Problem: AI Calls Not Triggering**

**Possible Causes:**
- Cron job not running
- Wrong timezone
- Africa's Talking API issue

**Solution:**
1. Check server logs for cron messages
2. Verify timezone setting
3. Test API credentials
4. Manual trigger to test

### **Problem: Calls Failing**

**Possible Causes:**
- Invalid phone numbers
- Network issues
- API rate limiting
- Insufficient credits

**Solution:**
1. Verify phone number format
2. Check Africa's Talking balance
3. Review error logs
4. Test with known good number

---

## **FAQ**

### **Q: What if teacher calls after 4 PM?**
**A:** AI won't call if teacher logs a call anytime before the cron job runs. The system checks for existing calls first.

### **Q: Can we change the 4 PM time?**
**A:** Yes! Set `AUTO_CALL_HOUR` environment variable (0-23).

### **Q: What if parent doesn't have a phone?**
**A:** Student will appear in follow-up queue but won't be called. Teacher must follow up in person.

### **Q: Do automated calls cost money?**
**A:** Yes, uses Africa's Talking credits. Monitor usage and top up as needed.

### **Q: Can parents call back?**
**A:** Not directly through IVR. They can press 9 to leave a voice message for the teacher.

### **Q: What languages are supported?**
**A:** English, Twi, and Ga. Language detected from phone prefix or parent preference.

### **Q: How many retry attempts?**
**A:** Maximum 3 attempts, 30 minutes apart.

### **Q: Can we disable automated calls?**
**A:** Yes, don't initialize the cron scheduler in server.js, or set schedule to never run.

---

## **Success Metrics**

### **Track These KPIs:**

1. **Parent Contact Rate**
   - Target: 100%
   - Formula: (Contacted / Total Absences) × 100

2. **AI Call Success Rate**
   - Target: > 70%
   - Formula: (Answered / Total AI Calls) × 100

3. **Teacher Call Rate**
   - Target: > 50%
   - Formula: (Manual Calls / Total Absences) × 100

4. **Average Response Time**
   - Target: < 8 hours
   - Formula: Time from absence to parent contact

---

## **Summary**

The automated AI calling system ensures **no absent student is forgotten**:

- ✅ Teachers call when they can
- ✅ AI calls when teachers can't
- ✅ 100% parent contact guaranteed
- ✅ All calls logged and tracked
- ✅ Multilingual support
- ✅ Automatic retries
- ✅ Statistics and reporting

**Result**: Better parent engagement, reduced dropout risk, improved student outcomes.

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**Status**: Production Ready
