# EduLink Ghana - Deployment Guide

Complete guide for deploying EduLink to production.

---

## 📋 Prerequisites

### Required Services
- MongoDB Atlas (or self-hosted MongoDB 5.0+)
- Redis (for job queue)
- Africa's Talking account
- Node.js 18+ runtime
- Python 3.9+ runtime

### Required Accounts
1. **MongoDB Atlas** - Database hosting
2. **Africa's Talking** - Telephony services
3. **Heroku/Railway/DigitalOcean** - Application hosting
4. **Cloudinary** (optional) - Media storage

---

## 🚀 Quick Deploy

### Option 1: Heroku

```bash
# Backend
cd backend
heroku create edulink-backend
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev
git push heroku master

# AI Service
cd ../ai-service
heroku create edulink-ai
git push heroku master
```

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway init
railway up

# Deploy AI service
cd ../ai-service
railway init
railway up
```

### Option 3: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

---

## 🔧 Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/edulink

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d

# Africa's Talking
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_CALLER_ID=+233XXXXXXXXX

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### AI Service (.env)

```env
# Server
FLASK_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/edulink

# Redis
REDIS_URL=redis://:password@host:6379

# Logging
LOG_LEVEL=info
```

---

## 📦 Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/edulink-ghana.git
cd edulink-ghana
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run database migrations (if any)
npm run migrate

# Start server
npm start
```

### 3. AI Service Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start service
python app.py
```

### 4. Verify Deployment

```bash
# Check backend health
curl https://your-backend-url.com/health

# Check AI service health
curl https://your-ai-url.com/health
```

---

## 🗄️ Database Setup

### MongoDB Atlas

1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for production)
4. Get connection string
5. Create database: `edulink`
6. Collections will be created automatically

### Indexes (Optional - for performance)

```javascript
// Run in MongoDB shell
use edulink

// Students
db.students.createIndex({ school: 1, enrollmentStatus: 1 })
db.students.createIndex({ "parentContacts.phone": 1 })

// Attendance
db.attendances.createIndex({ student: 1, date: -1 })
db.attendances.createIndex({ school: 1, date: -1 })

// Assessments
db.learningassessments.createIndex({ student: 1, assessmentDate: -1 })
db.learningassessments.createIndex({ school: 1, assessmentDate: -1 })

// Call Logs
db.calllogs.createIndex({ student: 1, timePlaced: -1 })
db.calllogs.createIndex({ result: 1, retryScheduled: 1 })
```

---

## 📞 Africa's Talking Setup

### 1. Create Account
- Sign up at https://africastalking.com
- Verify your account
- Add credits

### 2. Configure Voice
- Go to Voice → Settings
- Set callback URL: `https://your-backend-url.com/api/ivr/incoming`
- Set status callback URL: `https://your-backend-url.com/api/ivr/status`

### 3. Configure SMS
- Go to SMS → Settings
- Set delivery reports URL (optional)

### 4. Get Credentials
- API Key: Dashboard → API Key
- Username: Your username (usually "sandbox" for testing)

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set CORS_ORIGIN to your frontend domain
- [ ] Enable MongoDB authentication
- [ ] Use environment variables (never commit .env)
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Enable MongoDB encryption at rest

---

## 📊 Monitoring

### Application Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start npm --name "edulink-backend" -- start

# Start AI service with PM2
cd ai-service
pm2 start app.py --name "edulink-ai" --interpreter python3

# Monitor
pm2 monit

# View logs
pm2 logs edulink-backend
pm2 logs edulink-ai
```

### Health Checks

```bash
# Backend
curl https://your-backend-url.com/health

# AI Service
curl https://your-ai-url.com/health

# Redis
redis-cli ping

# MongoDB
mongosh "mongodb+srv://..." --eval "db.adminCommand('ping')"
```

---

## 🔄 Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="mongodb+srv://..." --out=/backups/edulink-$DATE

# Compress
tar -czf /backups/edulink-$DATE.tar.gz /backups/edulink-$DATE

# Upload to S3 (optional)
aws s3 cp /backups/edulink-$DATE.tar.gz s3://your-bucket/backups/
```

### Automated Backups
- MongoDB Atlas: Enable automated backups (Settings → Backup)
- Set retention period: 7 days minimum
- Test restore procedure monthly

---

## 🚨 Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs edulink-backend

# Common issues:
# 1. MongoDB connection failed
#    - Verify MONGODB_URI
#    - Check IP whitelist
#    - Verify credentials

# 2. Redis connection failed
#    - Verify REDIS_HOST and REDIS_PORT
#    - Check Redis is running: redis-cli ping

# 3. Port already in use
#    - Change PORT in .env
#    - Kill process: lsof -ti:5000 | xargs kill
```

### AI Service Won't Start

```bash
# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip list

# Common issues:
# 1. Module not found
#    - Reinstall: pip install -r requirements.txt

# 2. MongoDB connection failed
#    - Same as backend troubleshooting
```

### IVR Calls Not Working

```bash
# Check Africa's Talking configuration
# 1. Verify callback URLs are publicly accessible
# 2. Check API credentials
# 3. Verify phone number format (+233XXXXXXXXX)
# 4. Check call logs in Africa's Talking dashboard
```

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Run multiple backend instances
pm2 start npm --name "edulink-backend-1" -i 2 -- start

# Use load balancer (nginx)
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}
```

### Database Scaling
- MongoDB Atlas: Upgrade to M10+ cluster
- Enable sharding for large datasets
- Add read replicas

### Redis Scaling
- Use Redis Cluster for high availability
- Consider Redis Sentinel for failover

---

## 🎯 Performance Optimization

### Backend
- Enable gzip compression
- Use Redis caching
- Optimize database queries
- Enable CDN for static assets

### AI Service
- Use gunicorn with multiple workers
- Enable response caching
- Optimize model loading

---

## 📝 Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Review performance metrics
- [ ] Check backup success

### Monthly Tasks
- [ ] Update dependencies
- [ ] Security audit
- [ ] Test backup restore
- [ ] Review and optimize queries

---

## 🆘 Support

- **Documentation**: https://github.com/yourusername/edulink-ghana
- **Issues**: https://github.com/yourusername/edulink-ghana/issues
- **Email**: support@edulink.gh

---

**Status**: Production Ready ✅  
**Last Updated**: November 2025  
**Version**: 1.0.0
