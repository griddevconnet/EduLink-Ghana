# Deploy EduLink to Render

Complete guide to deploy EduLink backend and AI service to Render.

---

## 🎯 Why Render?

✅ **Free tier** - No credit card needed  
✅ **Auto-deploy** from GitHub  
✅ **Easy setup** - 5 minutes per service  
✅ **Built-in SSL** - HTTPS by default  
✅ **Supports Node.js & Python**  
✅ **Auto-scaling** on paid plans  

---

## 📋 Prerequisites

Before you start:
- [x] Code pushed to GitHub: https://github.com/griddevconnet/EduLink-Ghana
- [x] MongoDB Atlas account (free tier)
- [ ] Render account (create at https://render.com)

---

## 🚀 Step-by-Step Deployment

### Part 1: Setup MongoDB Atlas (5 minutes)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free tier)

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE** (M0)
   - Select region closest to you
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `edulink`
   - Password: Generate secure password (save it!)
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist All IPs**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   
   Example:
   ```
   mongodb+srv://edulink:YourPassword@cluster0.xxxxx.mongodb.net/edulink?retryWrites=true&w=majority
   ```

---

### Part 2: Deploy Backend to Render (10 minutes)

1. **Create Render Account**
   - Go to: https://render.com
   - Sign up with GitHub (easiest)
   - Authorize Render to access your repos

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `EduLink-Ghana`
   - Click "Connect"

3. **Configure Backend Service**
   
   **Basic Settings:**
   - **Name**: `edulink-backend`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://edulink:YourPassword@cluster0.xxxxx.mongodb.net/edulink
   JWT_SECRET=your-super-secret-jwt-key-change-this-production-key-12345
   JWT_EXPIRE=7d
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_API_KEY=your-api-key-here
   AFRICASTALKING_CALLER_ID=+233XXXXXXXXX
   LOG_LEVEL=info
   ```
   
   **Important**: 
   - Use your actual MongoDB connection string
   - Generate a strong JWT_SECRET (32+ characters)
   - Add Africa's Talking credentials (or use "sandbox" for testing)

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - You'll get a URL like: `https://edulink-backend.onrender.com`

6. **Verify Backend**
   - Visit: `https://edulink-backend.onrender.com/health`
   - Should see: `{"status":"ok","mongodb":"connected"}`

---

### Part 3: Deploy AI Service to Render (10 minutes)

1. **Create Another Web Service**
   - Click "New +" → "Web Service"
   - Select repository: `EduLink-Ghana`
   - Click "Connect"

2. **Configure AI Service**
   
   **Basic Settings:**
   - **Name**: `edulink-ai-service`
   - **Region**: Same as backend (Oregon)
   - **Branch**: `main`
   - **Root Directory**: `ai-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

3. **Add Environment Variables**
   
   ```env
   FLASK_ENV=production
   PORT=5001
   MONGODB_URI=mongodb+srv://edulink:YourPassword@cluster0.xxxxx.mongodb.net/edulink
   LOG_LEVEL=info
   ```
   
   Use the same MongoDB URI as backend!

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-7 minutes (Python takes longer)
   - You'll get a URL like: `https://edulink-ai-service.onrender.com`

5. **Verify AI Service**
   - Visit: `https://edulink-ai-service.onrender.com/health`
   - Should see: `{"status":"ok","mongodb":"connected"}`

---

## ✅ Verify Deployment

### Test Backend Endpoints

```bash
# Health check
curl https://edulink-backend.onrender.com/health

# Register user
curl -X POST https://edulink-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@edulink.gh",
    "password": "TestPass123!",
    "phone": "+233241234567",
    "role": "teacher"
  }'

# Login
curl -X POST https://edulink-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@edulink.gh",
    "password": "TestPass123!"
  }'
```

### Test AI Service Endpoints

```bash
# Health check
curl https://edulink-ai-service.onrender.com/health

# Language detection
curl -X POST https://edulink-ai-service.onrender.com/ai/detect-language \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Meda wo akye",
    "phone": "+233241234567",
    "region": "Ashanti"
  }'

# Risk scoring
curl -X POST https://edulink-ai-service.onrender.com/ai/score-risk \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "absences30Days": 12,
      "attendanceRate30Days": 60,
      "literacyLevel": "below_benchmark"
    }
  }'
```

---

## 🔧 Configure Africa's Talking Webhooks

Once deployed, update Africa's Talking with your Render URLs:

1. **Go to Africa's Talking Dashboard**
   - https://account.africastalking.com

2. **Configure Voice Webhooks**
   - Go to Voice → Settings
   - **Callback URL**: `https://edulink-backend.onrender.com/api/ivr/incoming`
   - **Status Callback**: `https://edulink-backend.onrender.com/api/ivr/status`

3. **Test IVR**
   - Make a test call
   - Check logs in Render dashboard

---

## 📊 Monitor Your Deployment

### Render Dashboard

- **Logs**: Real-time logs for debugging
- **Metrics**: CPU, memory, response times
- **Events**: Deployment history
- **Settings**: Environment variables, scaling

### Access Logs

1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. See real-time logs

---

## 🎯 Your Live URLs

After deployment, you'll have:

**Backend API:**
```
https://edulink-backend.onrender.com
```

**AI Service:**
```
https://edulink-ai-service.onrender.com
```

**API Endpoints:**
- Health: `/health`
- Auth: `/api/auth/*`
- Schools: `/api/schools/*`
- Students: `/api/students/*`
- Attendance: `/api/attendance/*`
- Assessments: `/api/assessments/*`
- IVR: `/api/ivr/*`
- AI: `/ai/*`

---

## ⚡ Free Tier Limitations

**Render Free Tier:**
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Auto-sleep after 15 min inactivity
- ✅ Cold start: 30-60 seconds
- ✅ 512 MB RAM
- ✅ Shared CPU

**MongoDB Atlas Free Tier:**
- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ ~10,000 students capacity

**Tips:**
- Services sleep after 15 min inactivity
- First request after sleep takes 30-60 sec
- Keep services awake with cron job (optional)

---

## 🚀 Upgrade Options (Optional)

### Keep Services Always On

**Option 1: Upgrade to Starter Plan** ($7/month per service)
- No sleep
- Faster performance
- More resources

**Option 2: Use Cron Job** (Free)
- Ping your service every 14 minutes
- Use cron-job.org or similar
- URL to ping: `https://edulink-backend.onrender.com/health`

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Go to Render dashboard
2. Click backend service
3. Check "Logs" tab

**Common Issues:**

**MongoDB Connection Failed**
```
Solution: Check MONGODB_URI
- Verify password is correct
- Check IP whitelist (0.0.0.0/0)
- Ensure user has read/write permissions
```

**Port Error**
```
Solution: Render sets PORT automatically
- Don't hardcode port in code
- Use: process.env.PORT || 5000
```

**Build Failed**
```
Solution: Check package.json
- Ensure all dependencies are listed
- Check Node.js version compatibility
```

### AI Service Won't Start

**Python Version Error**
```
Solution: Specify Python version
- Add runtime.txt file
- Content: python-3.9.18
```

**Module Not Found**
```
Solution: Check requirements.txt
- Ensure all packages are listed
- Check for typos
```

**Timeout During Build**
```
Solution: Large ML libraries take time
- First deployment may take 10-15 min
- Be patient!
```

### Service Sleeps Too Often

**Solution 1: Upgrade to Paid Plan**
- $7/month = always on

**Solution 2: Use Cron Job**
- Free service: cron-job.org
- Ping every 14 minutes
- URL: your-service.onrender.com/health

---

## 📈 Performance Optimization

### Backend

1. **Enable Compression**
   - Already configured in server.js

2. **Use Redis Caching** (Optional)
   - Add Redis from Render
   - Update REDIS_URL env var

3. **Database Indexes**
   - Already configured in models

### AI Service

1. **Model Caching**
   - Models load on first request
   - Subsequent requests are fast

2. **Batch Processing**
   - Use `/ai/score-risk/batch` for multiple students

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Backend health check returns 200
- [ ] AI service health check returns 200
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Can create school
- [ ] Can create student
- [ ] Language detection works
- [ ] Risk scoring works
- [ ] MongoDB shows data
- [ ] Africa's Talking webhooks configured

---

## 🔗 Important Links

**Your Services:**
- Backend: https://edulink-backend.onrender.com
- AI Service: https://edulink-ai-service.onrender.com

**Render:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs

**MongoDB Atlas:**
- Dashboard: https://cloud.mongodb.com
- Docs: https://www.mongodb.com/docs/atlas/

**Africa's Talking:**
- Dashboard: https://account.africastalking.com
- Docs: https://developers.africastalking.com

---

## 📞 Next Steps

After successful deployment:

1. **Update GitHub README** with live URLs
2. **Test all endpoints** with Postman
3. **Configure Africa's Talking** webhooks
4. **Monitor logs** for errors
5. **Share links** with team/UNICEF
6. **Build frontend** (mobile app/dashboard)

---

## 🆘 Need Help?

**Render Support:**
- Community: https://community.render.com
- Docs: https://render.com/docs

**EduLink Issues:**
- GitHub: https://github.com/griddevconnet/EduLink-Ghana/issues

---

**Ready to deploy!** 🚀

Follow the steps above and you'll have EduLink live in ~30 minutes!
