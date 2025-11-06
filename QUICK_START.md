# EduLink Ghana - Quick Start Guide

**Welcome to EduLink Ghana!** 🚀  
This guide will help you get started with the project.

---

## 📚 Essential Documents

1. **PROJECT_ROADMAP.md** - Complete task breakdown (184 tasks across 9 phases)
2. **PROGRESS.md** - Track what's done, what's in progress, what's next
3. **This file** - Quick commands and references

---

## 🎯 What We're Building

**EduLink Ghana** is a 4-pillar system to track out-of-school children for UNICEF/KOICA:

1. **EduConnect** - Teacher app for registration & attendance (offline-first)
2. **EduComm** - AI voice calls in local languages (IVR/USSD/SMS)
3. **LearnPulse** - Analytics dashboard with disaggregated data
4. **EduAssist** - AI recommendations for learning strategies

---

## 🏗️ Project Structure

```
EduLink/
├── backend/              # Node.js + Express + MongoDB
├── ai-service/           # Flask + Python ML models
├── teacher-app/          # React Native (offline-first)
├── admin-dashboard/      # React + Tailwind + shadcn/ui
├── docs/                 # Architecture diagrams, API specs
├── scripts/              # Deployment, seed data
├── PROJECT_ROADMAP.md    # Full task list
├── PROGRESS.md           # Progress tracker
└── QUICK_START.md        # This file
```

---

## 🚀 Getting Started (First Time Setup)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier)
- Code editor (VS Code recommended)

### Step 1: Clone & Setup
```bash
cd c:/Users/damed/Desktop/EduLink

# Initialize Git
git init
git add .
git commit -m "Initial commit: Project roadmap and docs"

# Create GitHub repo (optional)
# git remote add origin <your-repo-url>
# git push -u origin main
```

### Step 2: Backend Setup
```bash
mkdir backend && cd backend
npm init -y

# Install dependencies
npm install express mongoose dotenv cors helmet
npm install jsonwebtoken bcryptjs
npm install bullmq ioredis
npm install twilio africastalking
npm install winston

# Dev dependencies
npm install -D nodemon eslint prettier

# Create basic structure
mkdir src
mkdir src/models src/routes src/services src/middleware src/config
```

### Step 3: AI Service Setup
```bash
cd ..
mkdir ai-service && cd ai-service
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install flask flask-cors pymongo redis
pip install torch transformers
pip install librosa pydub
pip install scikit-learn xgboost
pip install python-dotenv

# Create requirements.txt
pip freeze > requirements.txt
```

### Step 4: Database Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Whitelist your IP (0.0.0.0/0 for development)

5. Go to [Redis Cloud](https://redis.com/try-free/)
6. Create free database
7. Get connection string

### Step 5: Environment Variables
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edulink
REDIS_URL=redis://default:password@redis-host:port
JWT_SECRET=your-secret-key-here

# Telephony (get from providers)
AFRICAS_TALKING_API_KEY=your-key
AFRICAS_TALKING_USERNAME=sandbox
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

NODE_ENV=development
```

Create `ai-service/.env`:
```env
FLASK_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edulink
REDIS_URL=redis://default:password@redis-host:port
```

---

## 🏃 Running the Project

### Backend (Node.js)
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### AI Service (Flask)
```bash
cd ai-service
venv\Scripts\activate  # Windows
python app.py
# Server runs on http://localhost:5001
```

### Teacher App (React Native)
```bash
cd teacher-app
npm start
# Follow Expo instructions
```

### Dashboard (React)
```bash
cd admin-dashboard
npm start
# Opens http://localhost:3000
```

---

## 📋 Daily Workflow

1. **Check PROGRESS.md** - See what's next
2. **Pick a task** from PROJECT_ROADMAP.md
3. **Implement & test**
4. **Update PROGRESS.md** - Mark task complete
5. **Commit changes** with clear message
6. **Repeat**

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### AI Service Tests
```bash
cd ai-service
pytest
```

### Frontend Tests
```bash
cd admin-dashboard
npm test
```

---

## 📦 Deployment (Later)

### Docker Compose (Local)
```bash
docker-compose up
```

### Production (Railway/Render)
- Push to GitHub
- Connect repo to Railway/Render
- Set environment variables
- Deploy

---

## 🔑 Key APIs (Once Built)

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
```

### Students
```bash
POST /api/students
GET /api/students
GET /api/students/:id
GET /api/students/out-of-school  # NEW for challenge
```

### Attendance
```bash
POST /api/attendance
GET /api/attendance
```

### Calls
```bash
POST /api/calls/trigger
GET /api/calls/:id
```

### Analytics
```bash
GET /api/analytics/attendance
GET /api/analytics/learning-outcomes  # NEW for challenge
GET /api/analytics/enrollment
```

---

## 🎨 Design Resources

### UI Components
- [shadcn/ui](https://ui.shadcn.com/) - React components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Icons

### Mockups
- Use Figma or draw.io for wireframes
- Keep it simple for MVP

---

## 📞 External Services Needed

1. **MongoDB Atlas** - Database (free tier)
2. **Redis Cloud** - Job queue (free tier)
3. **Africa's Talking** - Telephony (sandbox free, then pay-as-you-go)
4. **Twilio** - Backup telephony (trial credits)
5. **DigitalOcean Spaces** or **AWS S3** - Audio storage

---

## 🆘 Troubleshooting

### MongoDB connection fails
- Check connection string
- Whitelist IP address in Atlas
- Check network/firewall

### Redis connection fails
- Verify Redis URL format
- Check Redis Cloud dashboard

### Telephony not working
- Verify API keys
- Check sandbox mode vs production
- Check phone number format (+233...)

---

## 📖 Learning Resources

### Node.js + Express
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)

### Flask + Python
- [Flask Quickstart](https://flask.palletsprojects.com/en/2.3.x/quickstart/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/index)

### Telephony
- [Africa's Talking Docs](https://developers.africastalking.com/)
- [Twilio Docs](https://www.twilio.com/docs)

---

## 🎯 Current Focus (Week 1)

**Goal**: Complete Phase 1 - Project Setup

**Tasks**:
1. ✅ Create project structure
2. ✅ Write documentation
3. ⏳ Initialize Git repo
4. ⏳ Setup MongoDB Atlas
5. ⏳ Setup Redis Cloud
6. ⏳ Create backend skeleton
7. ⏳ Create AI service skeleton

---

## 💬 Questions?

Update PROGRESS.md with any blockers or questions, and we'll address them in the next session.

---

**Let's build something amazing! 🚀**
