# 🔧 How to Fix Follow-Up Queue (Step-by-Step)

## **The Problem**
Kofi is marked absent but doesn't appear in the follow-up queue because the attendance record was created with old backend code that set `followUpRequired: false`.

---

## **✅ EASIEST FIX: Use the "Clear Today" Button**

### **Step 1: Reload the Mobile App**
```
1. Close the app completely
2. Reopen it
3. Pull down to refresh
```

### **Step 2: Go to Attendance Screen**
```
1. Tap "Attendance" from home screen
2. Make sure you're on today's date (Nov 11, 2025)
```

### **Step 3: Click "Clear Today" Button**
```
1. Look for the button row with:
   - "All Present"
   - "All Absent"
   - "Clear Today" (RED button)
2. Tap "Clear Today"
3. Confirm when prompted
```

### **Step 4: Re-Mark Kofi as Absent**
```
1. Find Kofi Amedzie in the list
2. Tap on his card
3. Status should change to "Absent" (red)
4. Tap the blue save button (bottom right)
5. Wait for "Attendance saved successfully" message
```

### **Step 5: Check Follow-Up Queue**
```
1. Go back to Home screen
2. Tap "Follow-Up Queue" button
3. You should now see: "Kofi Amedzie - Absent today" ✅
```

---

## **Why This Works**

**Old Record:**
```json
{
  "student": "Kofi",
  "status": "absent",
  "followUpRequired": false  ❌ (old logic)
}
```

**New Record (after clearing and re-marking):**
```json
{
  "student": "Kofi",
  "status": "absent",
  "followUpRequired": true  ✅ (new logic)
}
```

---

## **Alternative: Wait for Backend to Redeploy**

If the "Clear Today" button doesn't work yet (app needs to reload):

### **Option 1: Wait for Render**
1. Check https://dashboard.render.com
2. Wait for deployment to complete (~5 minutes)
3. Then use "Clear Today" button

### **Option 2: Use MongoDB Atlas**
1. Go to https://cloud.mongodb.com
2. Browse Collections → `attendances`
3. Find record ID: `691354a82ae9c2ce2903fc06`
4. Edit: Change `followUpRequired` to `true`
5. Save
6. Refresh mobile app

---

## **Verification**

After fixing, verify it worked:

### **Check 1: Follow-Up Queue**
```
Home → Follow-Up Queue
Should see: "Kofi Amedzie - Absent today"
```

### **Check 2: Can Call Parent**
```
Tap "Call Now" button
Should dial: +233244546709 (Angelina Kplivi)
```

### **Check 3: Stats**
```
Follow-Up Queue should show:
- 1 student needing follow-up
- High priority (red badge)
```

---

## **What Happens Next**

### **If You Call Manually:**
1. Tap "Call Now"
2. Make the call
3. Log the call details
4. Kofi removed from queue ✅

### **If You Don't Call:**
1. At 4:00 PM today
2. AI will call automatically
3. Parent presses key (1-9)
4. Call logged automatically
5. Kofi removed from queue ✅

---

## **Troubleshooting**

### **"Clear Today" button not showing:**
- Close app completely
- Reopen app
- Pull down to refresh
- Button should appear

### **Follow-up queue still empty after fix:**
- Wait 30 seconds
- Pull down to refresh
- Check if Kofi is marked absent
- Try clearing and re-marking again

### **Can't save attendance:**
- Check internet connection
- Check if logged in
- Try logging out and back in

---

## **Summary**

**Quick Fix (2 minutes):**
1. ✅ Open app
2. ✅ Go to Attendance
3. ✅ Tap "Clear Today"
4. ✅ Re-mark Kofi as Absent
5. ✅ Save
6. ✅ Check Follow-Up Queue

**Result:** Kofi will appear in follow-up queue with correct flag! ✅

---

**Last Updated**: Nov 11, 2025 @ 5:30 PM  
**Status**: "Clear Today" button added and ready to use!
