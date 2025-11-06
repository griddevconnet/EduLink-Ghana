# EduLink Testing Guide

Quick guide to test EduLink locally.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Environment Files

**Backend (.env)**
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with these minimum values:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edulink
JWT_SECRET=test-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

**AI Service (.env)**
```bash
cd ai-service
copy .env.example .env
```

Edit `ai-service/.env` with:
```env
FLASK_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/edulink
LOG_LEVEL=info
```

---

## 📦 Option A: Test with Local MongoDB

### Install MongoDB Locally
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install mongodb`

### Start MongoDB
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
```

---

## ☁️ Option B: Test with MongoDB Atlas (Recommended)

### 1. Create Free Account
- Go to https://www.mongodb.com/cloud/atlas/register
- Sign up (it's free!)

### 2. Create Cluster
- Choose FREE tier (M0)
- Select region closest to you
- Click "Create Cluster" (takes 3-5 minutes)

### 3. Create Database User
- Click "Database Access" → "Add New Database User"
- Username: `edulink`
- Password: Generate secure password
- User Privileges: "Read and write to any database"
- Click "Add User"

### 4. Whitelist IP
- Click "Network Access" → "Add IP Address"
- Click "Allow Access from Anywhere" (0.0.0.0/0)
- Click "Confirm"

### 5. Get Connection String
- Click "Database" → "Connect"
- Choose "Connect your application"
- Copy connection string
- Replace `<password>` with your password

Example:
```
mongodb+srv://edulink:YourPassword@cluster0.xxxxx.mongodb.net/edulink?retryWrites=true&w=majority
```

### 6. Update .env Files
Paste the connection string in both:
- `backend/.env` → `MONGODB_URI=...`
- `ai-service/.env` → `MONGODB_URI=...`

---

## 🧪 Start Testing

### Terminal 1: Start Backend
```bash
cd backend
npm install
npm start
```

Expected output:
```
✅ MongoDB connected
🚀 EduLink Backend running on port 5000
📍 Environment: development
🔗 Health check: http://localhost:5000/health
```

### Terminal 2: Start AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py
```

Expected output:
```
✅ MongoDB connected successfully
🚀 EduLink AI Service starting on port 5001
📍 Environment: development
```

---

## ✅ Test Endpoints

### 1. Health Checks
```bash
# Backend
curl http://localhost:5000/health

# AI Service
curl http://localhost:5001/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@test.com\",\"password\":\"Password123!\",\"phone\":\"+233241234567\",\"role\":\"teacher\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@test.com\",\"password\":\"Password123!\"}"
```

**Save the token from response!**

### 4. Create School (use token from login)
```bash
curl -X POST http://localhost:5000/api/schools ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"name\":\"Test School\",\"region\":\"Greater Accra\",\"district\":\"Accra Metro\",\"type\":\"Primary\"}"
```

### 5. Test Language Detection
```bash
curl -X POST http://localhost:5001/ai/detect-language ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Meda wo akye\",\"phone\":\"+233241234567\",\"region\":\"Ashanti\"}"
```

### 6. Test Risk Scoring
```bash
curl -X POST http://localhost:5001/ai/score-risk ^
  -H "Content-Type: application/json" ^
  -d "{\"features\":{\"absences30Days\":12,\"attendanceRate30Days\":60,\"literacyLevel\":\"below_benchmark\",\"contactVerified\":false}}"
```

---

## 🎯 Using Postman (Easier!)

### Import Collection
1. Download Postman: https://www.postman.com/downloads/
2. Create new collection "EduLink"
3. Add requests for each endpoint
4. Use environment variables for token

### Example Requests

**Register**
- Method: POST
- URL: `http://localhost:5000/api/auth/register`
- Body (JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@test.com",
  "password": "Password123!",
  "phone": "+233241234567",
  "role": "teacher"
}
```

**Login**
- Method: POST
- URL: `http://localhost:5000/api/auth/login`
- Body (JSON):
```json
{
  "email": "john@test.com",
  "password": "Password123!"
}
```

**Create School**
- Method: POST
- URL: `http://localhost:5000/api/schools`
- Headers: `Authorization: Bearer {{token}}`
- Body (JSON):
```json
{
  "name": "Accra Primary School",
  "region": "Greater Accra",
  "district": "Accra Metro",
  "type": "Primary",
  "ownership": "Public"
}
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error: MongoDB connection failed**
```
Solution: Check MONGODB_URI in .env
- Local: mongodb://localhost:27017/edulink
- Atlas: mongodb+srv://user:pass@cluster.mongodb.net/edulink
```

**Error: Port 5000 already in use**
```
Solution: Change PORT in .env to 5001 or kill process
Windows: netstat -ano | findstr :5000
        taskkill /PID <PID> /F
```

### AI Service won't start

**Error: No module named 'flask'**
```
Solution: Activate venv and install dependencies
venv\Scripts\activate
pip install -r requirements.txt
```

**Error: Python version**
```
Solution: Need Python 3.9+
python --version
```

### MongoDB Atlas Issues

**Error: Authentication failed**
```
Solution: 
1. Check username/password in connection string
2. Ensure user has "Read and write" privileges
3. Check IP whitelist (0.0.0.0/0 for testing)
```

**Error: Connection timeout**
```
Solution:
1. Check internet connection
2. Verify IP whitelist
3. Check firewall settings
```

---

## 📊 Test Checklist

After setup, verify:

- [ ] Backend health check returns 200
- [ ] AI service health check returns 200
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Can create school with token
- [ ] Can create student
- [ ] Can mark attendance
- [ ] Language detection works
- [ ] Risk scoring works
- [ ] MongoDB shows data in collections

---

## 🎓 Next Steps

Once testing works:

1. **Test all endpoints** - Use Postman collection
2. **Check data in MongoDB** - Use MongoDB Compass
3. **Test error cases** - Invalid data, missing auth, etc.
4. **Test Africa's Talking** - Add API keys for IVR/SMS
5. **Deploy to staging** - Test in cloud environment

---

## 📞 Need Help?

**Common Issues**:
- MongoDB connection → Use MongoDB Atlas (free)
- Port conflicts → Change PORT in .env
- Module errors → Reinstall dependencies
- Token issues → Check JWT_SECRET in .env

**Documentation**:
- [Quick Start](QUICKSTART.md)
- [API Docs](backend/API_DOCUMENTATION.md)
- [Deployment](DEPLOYMENT.md)

---

**Ready to test!** 🚀

Choose your path:
- **Quick**: MongoDB Atlas (5 min setup)
- **Local**: Install MongoDB locally
- **Cloud**: Deploy and test in production
