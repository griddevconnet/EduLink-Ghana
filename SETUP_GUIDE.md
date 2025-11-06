# EduLink Ghana - Complete Setup Guide

This guide will walk you through setting up the entire EduLink Ghana development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js 18+** and npm - [Download](https://nodejs.org/)
- ✅ **Python 3.10+** - [Download](https://www.python.org/)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **Docker Desktop** (optional, for local MongoDB/Redis) - [Download](https://www.docker.com/)
- ✅ **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

## Step 1: Clone the Repository

```bash
cd c:/Users/damed/Desktop
cd EduLink
```

## Step 2: Setup Backend (Node.js)

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

This will install:
- Express (web framework)
- Mongoose (MongoDB ODM)
- BullMQ (job queue)
- Twilio & Africa's Talking SDKs
- Winston (logging)
- And more...

### 2.2 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and configure:
- MongoDB connection string (see Step 4)
- Redis connection string (see Step 4)
- JWT secret (generate a random string)
- Telephony API keys (optional for now)

### 2.3 Test Backend

```bash
npm run dev
```

You should see:
```
🚀 EduLink Backend running on port 5000
📍 Environment: development
🔗 Health check: http://localhost:5000/health
```

Visit http://localhost:5000/health to verify it's working.

**Press Ctrl+C to stop the server.**

---

## Step 3: Setup AI Service (Python)

### 3.1 Create Virtual Environment

```bash
cd ../ai-service
python -m venv venv
```

### 3.2 Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3.3 Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- PyTorch & Transformers (ML models)
- Librosa (audio processing)
- XGBoost (risk prediction)
- And more...

**Note:** This may take 5-10 minutes as PyTorch is large.

### 3.4 Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with the same MongoDB and Redis URLs from Step 2.

### 3.5 Test AI Service

```bash
python app.py
```

You should see:
```
🚀 EduLink AI Service starting on port 5001
📍 Environment: development
```

Visit http://localhost:5001/health to verify it's working.

**Press Ctrl+C to stop the server.**

---

## Step 4: Setup Databases

You have two options: **Cloud** (recommended for pilot) or **Local** (for development).

### Option A: Cloud Databases (Recommended)

#### MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Log in
3. Create a **free cluster** (M0)
4. Click **Connect** → **Connect your application**
5. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/edulink?retryWrites=true&w=majority
   ```
6. Replace `username` and `password` with your credentials
7. Add this to both `.env` files (backend and ai-service)

**Important:** Whitelist your IP address in Atlas:
- Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)

#### Redis Cloud (Free Tier)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up / Log in
3. Create a **free database** (30MB)
4. Copy the connection string:
   ```
   redis://default:password@redis-host:port
   ```
5. Add this to both `.env` files

### Option B: Local Databases (Docker)

If you prefer to run databases locally:

```bash
# From project root
docker-compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

Use these connection strings in your `.env` files:
```
MONGODB_URI=mongodb://admin:edulink2025@localhost:27017/edulink?authSource=admin
REDIS_URL=redis://:edulink2025@localhost:6379
```

To stop:
```bash
docker-compose down
```

---

## Step 5: Verify Everything Works

### 5.1 Start All Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
venv\Scripts\activate  # Windows
python app.py
```

**Terminal 3 - Test:**
```bash
# Test backend
curl http://localhost:5000/health

# Test AI service
curl http://localhost:5001/health
```

You should get JSON responses with `"status": "ok"`.

---

## Step 6: Next Steps

✅ **Phase 1 Complete!** You now have:
- Backend API running on port 5000
- AI Service running on port 5001
- MongoDB and Redis connected

**Next:** Move to Phase 2 - Data Models
- See `PROJECT_ROADMAP.md` for next tasks
- We'll create Mongoose schemas for Student, School, Attendance, etc.

---

## Troubleshooting

### Backend won't start

**Error: `Cannot find module 'express'`**
- Solution: Run `npm install` in the backend folder

**Error: `MongooseServerSelectionError`**
- Solution: Check your MongoDB connection string in `.env`
- Verify IP is whitelisted in MongoDB Atlas

**Error: `Redis connection failed`**
- Solution: Check your Redis connection string in `.env`
- Verify Redis is running (Docker or cloud)

### AI Service won't start

**Error: `No module named 'flask'`**
- Solution: Activate virtual environment and run `pip install -r requirements.txt`

**Error: `torch not found`**
- Solution: PyTorch installation may have failed. Try:
  ```bash
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  ```

### Port already in use

**Error: `EADDRINUSE: address already in use :::5000`**
- Solution: Another process is using port 5000
- Find and kill it:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -i :5000
  kill -9 <PID>
  ```

### Docker issues

**Error: `docker-compose: command not found`**
- Solution: Install Docker Desktop

**Error: `Cannot connect to Docker daemon`**
- Solution: Start Docker Desktop application

---

## Useful Commands

### Backend
```bash
npm run dev          # Start development server
npm test             # Run tests
npm run lint         # Check code style
npm run format       # Format code
```

### AI Service
```bash
python app.py        # Start server
pytest               # Run tests (when available)
```

### Docker
```bash
docker-compose up -d              # Start databases
docker-compose down               # Stop databases
docker-compose logs mongodb       # View MongoDB logs
docker-compose logs redis         # View Redis logs
```

### Git
```bash
git status                        # Check status
git add .                         # Stage all changes
git commit -m "message"           # Commit changes
git log --oneline                 # View commit history
```

---

## Environment Variables Reference

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
REDIS_URL=<your-redis-connection-string>
JWT_SECRET=<random-secret-key>
AFRICAS_TALKING_API_KEY=<optional-for-now>
TWILIO_ACCOUNT_SID=<optional-for-now>
```

### AI Service `.env`
```env
FLASK_ENV=development
PORT=5001
MONGODB_URI=<same-as-backend>
REDIS_URL=<same-as-backend>
LOG_LEVEL=INFO
```

---

## Getting Help

- Check `PROJECT_ROADMAP.md` for task list
- Check `PROGRESS.md` for current status
- Check `QUICK_START.md` for quick reference
- Check individual service READMEs:
  - `backend/README.md`
  - `ai-service/README.md`

---

**Ready to build! 🚀**
