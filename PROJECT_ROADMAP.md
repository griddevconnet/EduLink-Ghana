# EduLink Ghana - Complete Implementation Roadmap

**Project Goal**: Build an AI-powered, multilingual school-to-home communication system for UNICEF/KOICA Challenge  
**Target**: Track enrollment, retention, and learning outcomes for out-of-school children in Ghana  
**Timeline**: 12-16 weeks to MVP + Pilot  

---

## 📊 Progress Overview

- [ ] **Phase 1**: Project Setup & Foundation (Week 1)
- [ ] **Phase 2**: Enhanced Data Models (Week 1-2)
- [ ] **Phase 3**: Backend Core APIs (Week 2-4)
- [ ] **Phase 4**: Telephony Integration - EduComm (Week 4-6)
- [ ] **Phase 5**: AI/Analytics Service - LearnPulse (Week 6-8)
- [ ] **Phase 6**: Teacher Mobile App - EduConnect (Week 8-10)
- [ ] **Phase 7**: Admin Dashboard - LearnPulse UI (Week 10-12)
- [ ] **Phase 8**: Testing & Documentation (Week 12-14)
- [ ] **Phase 9**: UNICEF Submission Package (Week 14-16)

---

## Phase 1: Project Setup & Foundation (Week 1)

### 1.1 Repository & Project Structure
- [ ] Initialize Git repository
- [ ] Create monorepo structure:
  ```
  /backend          (Node.js + Express)
  /ai-service       (Flask + Python ML)
  /teacher-app      (React Native)
  /admin-dashboard  (React)
  /docs             (Architecture, API specs)
  /scripts          (Deployment, seed data)
  ```
- [ ] Add `.gitignore` for Node, Python, React Native
- [ ] Create `README.md` with project overview

### 1.2 Backend Setup (Node.js)
- [ ] Initialize `package.json` with dependencies:
  - express, mongoose, dotenv, cors, helmet
  - jsonwebtoken, bcryptjs (auth)
  - bullmq, ioredis (job queue)
  - twilio, africastalking (telephony SDKs)
  - winston (logging)
- [ ] Setup Express server with basic middleware
- [ ] Configure MongoDB connection (Atlas)
- [ ] Setup Redis connection
- [ ] Create environment config (`.env.example`)
- [ ] Setup logging with Winston

### 1.3 AI Service Setup (Python/Flask)
- [ ] Initialize `requirements.txt`:
  - flask, flask-cors, pymongo, redis
  - torch, transformers (Hugging Face)
  - librosa, pydub (audio processing)
  - scikit-learn, xgboost (ML models)
- [ ] Setup Flask app structure
- [ ] Configure MongoDB and Redis connections
- [ ] Setup basic health check endpoint

### 1.4 Development Tools
- [ ] Setup ESLint + Prettier for Node/React
- [ ] Setup Black + Pylint for Python
- [ ] Create Docker Compose for local dev (MongoDB, Redis)
- [ ] Setup VS Code workspace settings

---

## Phase 2: Enhanced Data Models (Week 1-2)

### 2.1 Core Mongoose Schemas (Node.js)
- [ ] **School Model** (`models/School.js`)
  - Fields: name, district, region, gps, headteacher_contact, languages_supported
  - Indexes: district, region
  
- [ ] **Student Model** (`models/Student.js`)
  - Fields: first_name, last_name, dob, gender, school_id, class
  - **NEW**: enrollment_status (enrolled | never_enrolled | dropped_out)
  - **NEW**: disability_status (none | visual | hearing | physical | cognitive)
  - **NEW**: wealth_proxy (phone_verified | proxy_only | no_contact)
  - **NEW**: location_type (urban | rural | remote)
  - parent_contacts array with verification status
  - home_gps coordinates
  - Indexes: school_id, enrollment_status, disability_status

- [ ] **Attendance Model** (`models/Attendance.js`)
  - Fields: student_id, school_id, date, status, reason, marked_by
  - Indexes: student_id + date, school_id + date

- [ ] **CallLog Model** (`models/CallLog.js`)
  - Fields: student_id, phone, provider, time_placed, result, dtmf_input
  - audio_blob_path, language_detected, duration_seconds

- [ ] **User Model** (`models/User.js`)
  - Fields: name, phone, role (teacher | headteacher | admin | district_officer)
  - password_hash, school_id, verified

- [ ] **LearningAssessment Model** (`models/LearningAssessment.js`) ⭐ NEW
  - Fields: student_id, date, literacy_level (below | meeting | exceeding)
  - numeracy_level, teacher_notes, assessed_by

- [ ] **RiskScore Model** (`models/RiskScore.js`)
  - Fields: student_id, risk_score (0-1), features object, last_computed

- [ ] **MessageTemplate Model** (`models/MessageTemplate.js`)
  - Fields: type, language, content, variables_supported

### 2.2 Validation & Middleware
- [ ] Add Mongoose validation rules
- [ ] Create data sanitization middleware
- [ ] Add audit logging for sensitive operations

---

## Phase 3: Backend Core APIs (Week 2-4)

### 3.1 Authentication & Authorization
- [ ] `POST /api/auth/register` - Teacher/admin registration
- [ ] `POST /api/auth/login` - JWT-based login
- [ ] `POST /api/auth/verify-phone` - OTP verification
- [ ] Middleware: `authenticateToken`, `authorizeRole`

### 3.2 School Management APIs
- [ ] `POST /api/schools` - Create school (admin only)
- [ ] `GET /api/schools` - List schools (with filters)
- [ ] `GET /api/schools/:id` - Get school details
- [ ] `PUT /api/schools/:id` - Update school

### 3.3 Student Management APIs
- [ ] `POST /api/students` - Register student (with out-of-school flag)
- [ ] `GET /api/students` - List students (filters: school, enrollment_status, disability)
- [ ] `GET /api/students/:id` - Get student details
- [ ] `PUT /api/students/:id` - Update student
- [ ] `POST /api/students/:id/contacts` - Add/verify parent contact
- [ ] `GET /api/students/out-of-school` - List out-of-school children ⭐ NEW

### 3.4 Attendance APIs
- [ ] `POST /api/attendance` - Mark attendance (bulk support)
- [ ] `GET /api/attendance` - Query attendance (by date, school, student)
- [ ] `POST /api/attendance/trigger-call` - Manually trigger follow-up call

### 3.5 Learning Assessment APIs ⭐ NEW
- [ ] `POST /api/assessments` - Record literacy/numeracy assessment
- [ ] `GET /api/assessments/:student_id` - Get student assessment history
- [ ] `GET /api/assessments/summary` - Aggregate learning outcomes by school/district

### 3.6 Call Management APIs
- [ ] `POST /api/calls/trigger` - Trigger call for absence
- [ ] `GET /api/calls/:id` - Get call log details
- [ ] `GET /api/calls` - List calls (filters: student, date, result)
- [ ] `POST /api/calls/webhook` - Receive telephony provider callbacks

### 3.7 Analytics APIs
- [ ] `GET /api/analytics/attendance` - Attendance trends (disaggregated)
- [ ] `GET /api/analytics/enrollment` - Enrollment stats (in-school vs out-of-school)
- [ ] `GET /api/analytics/learning-outcomes` - Literacy/numeracy benchmarks ⭐ NEW
- [ ] `GET /api/analytics/risk` - At-risk students list
- [ ] `GET /api/analytics/call-performance` - Call answer rates, language detection stats

### 3.8 Background Jobs (BullMQ)
- [ ] Job: `trigger-absence-call` - Queue call when student absent
- [ ] Job: `retry-failed-call` - Retry logic with exponential backoff
- [ ] Job: `verify-contact` - Send verification call/SMS
- [ ] Job: `compute-risk-scores` - Batch risk score computation
- [ ] Worker setup with error handling and logging

---

## Phase 4: Telephony Integration - EduComm (Week 4-6)

### 4.1 Telephony Provider Setup
- [ ] Create Africa's Talking sandbox account
- [ ] Create Twilio trial account (backup)
- [ ] Store API keys in environment variables
- [ ] Test basic SMS sending

### 4.2 Telephony Adapter Pattern
- [ ] Create `services/telephony/TelephonyAdapter.js` (abstract interface)
- [ ] Implement `AfricasTalkingAdapter.js`
- [ ] Implement `TwilioAdapter.js`
- [ ] Factory pattern to select provider

### 4.3 IVR Call Flows
- [ ] Design IVR script templates (English, Twi, Ewe, Dagbani)
- [ ] Implement call placement logic
- [ ] Implement DTMF menu handling
- [ ] Store audio files in cloud storage (S3/Spaces)
- [ ] Implement language detection fallback (phone prefix mapping)

### 4.4 USSD Integration
- [ ] `POST /api/ussd/callback` - Receive USSD sessions
- [ ] USSD menu flow:
  - Register child
  - Report attendance
  - Request callback
- [ ] Session state management (Redis)

### 4.5 SMS Fallback
- [ ] SMS template system
- [ ] Batch SMS sending for reminders
- [ ] SMS opt-out handling

### 4.6 Call Logging & Audio Storage
- [ ] Upload call recordings to object storage
- [ ] Link audio files to CallLog documents
- [ ] Implement audio playback API for dashboard

---

## Phase 5: AI/Analytics Service - LearnPulse (Week 6-8)

### 5.1 Flask API Setup
- [ ] Create REST endpoints:
  - `POST /ai/detect-language` - Audio language detection
  - `POST /ai/transcribe` - Speech-to-text
  - `POST /ai/score-risk` - Compute dropout risk
  - `GET /ai/recommendations/:student_id` - Learning strategy suggestions

### 5.2 Language Detection Model
- [ ] Collect sample audio data (Twi, Ewe, Dagbani, Ga, Hausa)
- [ ] Implement phone-prefix fallback logic
- [ ] Placeholder: Return phone-prefix language for MVP
- [ ] TODO: Fine-tune Wav2Vec2 model post-pilot

### 5.3 Dropout Risk Scoring
- [ ] Feature engineering:
  - Absences in last 7/30/90 days
  - Contact verification status
  - Learning assessment scores
  - Disability status, wealth proxy
- [ ] Implement rule-based risk scoring (MVP)
- [ ] Train XGBoost model (post-pilot with real data)

### 5.4 Learning Strategy Recommender ⭐ NEW
- [ ] Rule-based recommendations:
  - Low literacy → "Read-aloud practice at home"
  - High absences → "Parent engagement call"
  - Disability → "Refer to special education support"
- [ ] Store recommendation templates in MongoDB
- [ ] Track recommendation effectiveness

### 5.5 Analytics Aggregations
- [ ] Implement disaggregated data queries:
  - Attendance by gender, disability, location
  - Out-of-school children by district
  - Learning outcomes by wealth proxy
- [ ] Generate CSV exports for GES/UNICEF

---

## Phase 6: Teacher Mobile App - EduConnect (Week 8-10)

### 6.1 React Native Setup
- [ ] Initialize React Native project (Expo or bare workflow)
- [ ] Setup navigation (React Navigation)
- [ ] Setup state management (Redux Toolkit or React Query)
- [ ] Setup offline storage (SQLite or AsyncStorage)

### 6.2 Authentication Screens
- [ ] Login screen (phone + OTP)
- [ ] Registration screen (teacher details)

### 6.3 Student Registration Flow
- [ ] Form: Student details (name, DOB, gender, class)
- [ ] **NEW**: Enrollment status selector (enrolled | never_enrolled | dropped_out)
- [ ] **NEW**: Disability status selector
- [ ] **NEW**: Location type (urban/rural/remote)
- [ ] Parent contact input (multiple contacts)
- [ ] Community proxy contact option
- [ ] GPS capture for home location
- [ ] Offline queue for registrations

### 6.4 Attendance Marking
- [ ] Daily attendance screen (class roster)
- [ ] Bulk mark present/absent
- [ ] Reason selector for absences
- [ ] Offline queue with sync indicator

### 6.5 Learning Assessment Input ⭐ NEW
- [ ] Quick assessment form:
  - Literacy level (below/meeting/exceeding)
  - Numeracy level
  - Teacher notes
- [ ] Offline queue for assessments

### 6.6 Student Detail View
- [ ] View student profile
- [ ] Attendance history
- [ ] Call logs (parent responses)
- [ ] Learning assessment history
- [ ] Trigger manual follow-up call

### 6.7 Offline Sync Logic
- [ ] Queue manager for offline actions
- [ ] Background sync on connectivity
- [ ] Conflict resolution (timestamp-based)
- [ ] Sync status indicators

---

## Phase 7: Admin Dashboard - LearnPulse UI (Week 10-12)

### 7.1 React Dashboard Setup
- [ ] Initialize React app (Vite or Create React App)
- [ ] Setup routing (React Router)
- [ ] Setup state management (React Query)
- [ ] Setup UI library (Tailwind CSS + shadcn/ui)

### 7.2 Authentication
- [ ] Login page (admin/district officer)
- [ ] Role-based access control

### 7.3 Overview Dashboard
- [ ] KPI cards:
  - Total enrolled students
  - Out-of-school children count ⭐ NEW
  - Attendance rate (today, this week)
  - Call answer rate
  - At-risk students count
- [ ] Attendance trend chart (line chart)
- [ ] Regional heatmap (map visualization)

### 7.4 Student Management
- [ ] Student list table (with filters)
- [ ] **NEW**: Filter by enrollment status, disability, gender, location
- [ ] Student detail modal
- [ ] Bulk import students (CSV upload)

### 7.5 Out-of-School Children Dashboard ⭐ NEW
- [ ] Dedicated page for out-of-school tracking
- [ ] Heatmap by district
- [ ] Reasons breakdown (poverty, disability, distance)
- [ ] Export to CSV

### 7.6 Learning Outcomes Dashboard ⭐ NEW
- [ ] Literacy/numeracy benchmark charts
- [ ] Disaggregated by gender, disability, wealth
- [ ] School comparison view

### 7.7 Call Logs & Analytics
- [ ] Call log table (with audio playback)
- [ ] Language detection stats
- [ ] Call success rate by time of day
- [ ] Parent response breakdown

### 7.8 Risk & Interventions
- [ ] At-risk students list (sortable by risk score)
- [ ] Intervention tracking (mark as contacted)
- [ ] Export list for field officers

### 7.9 School & User Management
- [ ] School list and CRUD
- [ ] Teacher/admin user management
- [ ] Role assignment

---

## Phase 8: Testing & Documentation (Week 12-14)

### 8.1 Backend Testing
- [ ] Unit tests for models (Mongoose schemas)
- [ ] Unit tests for API routes (Jest + Supertest)
- [ ] Integration tests for telephony webhooks
- [ ] Test coverage > 70%

### 8.2 Frontend Testing
- [ ] Component tests (React Testing Library)
- [ ] E2E tests for critical flows (Playwright or Cypress)
- [ ] Offline sync testing (simulate network loss)

### 8.3 AI Service Testing
- [ ] Unit tests for risk scoring logic
- [ ] Test language detection fallback
- [ ] Validate recommendation engine rules

### 8.4 API Documentation
- [ ] Generate OpenAPI/Swagger docs
- [ ] Postman collection for all endpoints
- [ ] Authentication guide

### 8.5 Deployment Documentation
- [ ] Docker Compose setup guide
- [ ] Kubernetes deployment manifests
- [ ] Environment variables reference
- [ ] Database migration guide

### 8.6 User Documentation
- [ ] Teacher app user guide (with screenshots)
- [ ] Dashboard user guide
- [ ] IVR script translation guide

---

## Phase 9: UNICEF Submission Package (Week 14-16)

### 9.1 Concept Note (2-3 pages)
- [ ] Problem statement (use challenge background)
- [ ] Solution overview (4 pillars)
- [ ] How it addresses constraints (table format)
- [ ] Competitive advantages
- [ ] Team & partnerships

### 9.2 Technical Appendix
- [ ] System architecture diagram (Mermaid or draw.io)
- [ ] Data model diagram
- [ ] Security & privacy plan
- [ ] Scalability strategy
- [ ] Technology stack summary

### 9.3 Pilot Plan
- [ ] Target district selection criteria
- [ ] School selection (10-12 schools, ~2,000 students)
- [ ] Timeline (6 months)
- [ ] Milestones & deliverables
- [ ] KPIs & success metrics
- [ ] Risk mitigation plan

### 9.4 Budget Breakdown
- [ ] Telephony costs (per call, per SMS)
- [ ] Cloud hosting (MongoDB Atlas, Redis, compute)
- [ ] Development & personnel
- [ ] Field operations (training, community liaisons)
- [ ] Contingency (10-15%)
- [ ] Total pilot cost estimate

### 9.5 Mockups & Wireframes
- [ ] Teacher app screens (Figma or hand-drawn)
  - Registration flow
  - Attendance marking
  - Learning assessment
- [ ] Dashboard wireframes
  - Overview
  - Out-of-school children page
  - Learning outcomes page
- [ ] IVR call flow diagram

### 9.6 Sustainability Plan
- [ ] GES integration roadmap
- [ ] Telco partnership strategy
- [ ] Open-source licensing plan
- [ ] Revenue model (if applicable)

### 9.7 Letter of Support
- [ ] Draft request letter for GES district director
- [ ] Draft request letter for school headteacher
- [ ] Follow up and secure signature

### 9.8 Final Package Assembly
- [ ] Compile all documents into PDF
- [ ] Create executive summary (1-page)
- [ ] Proofread and format
- [ ] Submit via UNICEF portal

---

## 🎯 Critical Path Items (Must-Have for MVP)

1. ✅ Student registration with out-of-school flag
2. ✅ Parent contact verification
3. ✅ Daily attendance input (offline-capable)
4. ✅ Auto-triggered IVR calls with DTMF
5. ✅ Call logging and response capture
6. ✅ Basic dashboard with disaggregated data
7. ✅ Learning assessment input & reporting
8. ✅ Risk scoring (rule-based)

---

## 📦 Post-MVP Features (Nice-to-Have)

- Fine-tuned language detection model (requires labeled audio data)
- Speech-to-text for open-ended responses
- WhatsApp integration for literate parents
- Parent-initiated USSD flows
- SMS campaigns for awareness
- Mobile money integration for school fees
- Integration with GES EMIS API

---

## 🚀 Quick Start Commands (Once Setup Complete)

```bash
# Start backend
cd backend && npm run dev

# Start AI service
cd ai-service && python app.py

# Start dashboard
cd admin-dashboard && npm start

# Start teacher app
cd teacher-app && npm start

# Run all with Docker Compose
docker-compose up
```

---

## 📞 Key Contacts & Resources

- **Telephony**: Africa's Talking (sandbox), Twilio (backup)
- **Database**: MongoDB Atlas (free tier for pilot)
- **Hosting**: Railway/Render (Node), Heroku (Flask)
- **Audio Storage**: DigitalOcean Spaces or AWS S3
- **Linguists**: [TODO: Contact local universities for IVR translations]
- **GES Contact**: [TODO: Identify district education officer]

---

## 📊 Success Metrics (Pilot KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Enrollment completeness | > 95% | Registered students / official enrollment |
| Contact verification rate | > 70% | Verified contacts / total contacts |
| Call answer rate | > 40% | Answered calls / total calls |
| Parent response capture | > 60% | Responses logged / absences |
| Teacher app adoption | > 80% | Teachers using daily / total teachers |
| Learning assessment coverage | > 50% | Students assessed / total students |
| Dropout reduction | 10-20% | Dropouts year-over-year comparison |

---

**Last Updated**: 2025-11-06  
**Project Lead**: Desmond (Nexus Coders)  
**Status**: Phase 1 - Ready to Start 🚀
