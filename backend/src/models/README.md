# EduLink Data Models

Complete Mongoose schemas for EduLink Ghana with full UNICEF challenge requirements.

## Models Overview

### 1. School
**Purpose**: Store school information and metadata  
**Key Fields**: name, region, district, GPS coordinates, headteacher contact, languages supported  
**UNICEF Alignment**: Regional disaggregation

### 2. User
**Purpose**: Authentication and role management  
**Key Fields**: name, phone, email, role, school assignment  
**Roles**: teacher, headteacher, admin, district_officer, national_admin  
**Features**: Password hashing, phone verification, role-based permissions

### 3. Student ⭐ CORE MODEL
**Purpose**: Student registration with comprehensive tracking  
**Key UNICEF Fields**:
- `enrollmentStatus`: enrolled | never_enrolled | dropped_out
- `disabilityStatus`: None | Visual | Hearing | Physical | Cognitive | Multiple
- `locationType`: Urban | Rural | Remote
- `wealthProxy`: phone_verified | proxy_only | no_contact
- `gender`: Male | Female | Other
- `parentContacts`: Array with verification status, language preference, proxy support

**Features**:
- Out-of-school children tracking
- Disaggregated data (gender, disability, location, wealth)
- Community proxy contacts for non-phone households
- Parent contact verification
- Dropout tracking with reasons

### 4. Attendance
**Purpose**: Daily attendance tracking with follow-up  
**Key Fields**: student, date, status, reason, follow-up tracking  
**Features**:
- Auto-trigger calls for unknown absences
- Attendance rate calculation
- Follow-up completion tracking
- Link to CallLog

### 5. CallLog
**Purpose**: Telephony call records and outcomes  
**Key Fields**: phone, provider, result, DTMF input, language detected, audio recording  
**Features**:
- Language detection tracking
- DTMF and speech transcript capture
- Retry scheduling
- Cost tracking
- Answer rate statistics

### 6. LearningAssessment ⭐ NEW FOR UNICEF
**Purpose**: Track foundational literacy and numeracy outcomes  
**Key Fields**:
- `literacyLevel`: below_benchmark | meeting_benchmark | exceeding_benchmark
- `numeracyLevel`: below_benchmark | meeting_benchmark | exceeding_benchmark
- `literacyScore`, `numeracyScore`: 0-100
- Detailed assessment (can read, can count, etc.)

**Features**:
- Disaggregated learning outcomes by gender, disability, location
- Intervention recommendations
- Progress tracking over time
- School-level summaries

### 7. RiskScore
**Purpose**: Dropout risk prediction and intervention tracking  
**Key Fields**:
- `riskScore`: 0-1 (1 = highest risk)
- `riskLevel`: low | medium | high | critical
- `features`: Absences, contact status, learning scores, demographics
- `recommendedInterventions`: Array of suggested actions

**Features**:
- Rule-based scoring (MVP) with ML-ready structure
- Automatic intervention recommendations
- Score history for trend analysis
- High-risk student identification

### 8. MessageTemplate
**Purpose**: Multilingual message templates for IVR/SMS/WhatsApp  
**Key Fields**: type, language, content, variables, audio file path  
**Languages**: English, Twi, Ewe, Ga, Dagbani, Hausa, Gonja, Fante, Nzema  
**Features**:
- Variable substitution ({{child_name}}, {{parent_name}})
- Quality review tracking
- Usage statistics
- Multi-channel support (IVR, SMS, WhatsApp, USSD)

---

## UNICEF Challenge Alignment

| Requirement | Implementation |
|-------------|----------------|
| **Track enrollment** | Student.enrollmentStatus field |
| **Track retention** | Attendance model + dropout tracking |
| **Track learning** | LearningAssessment model (literacy/numeracy) |
| **Out-of-school children** | Student.enrollmentStatus = never_enrolled \| dropped_out |
| **Disaggregated data** | Student: gender, disabilityStatus, locationType, wealthProxy |
| **Gender** | Student.gender |
| **Disability** | Student.disabilityStatus + details |
| **Location** | Student.locationType (Urban/Rural/Remote) |
| **Wealth proxy** | Student.wealthProxy (phone ownership) |
| **Learning outcomes** | LearningAssessment.literacyLevel, numeracyLevel |
| **Inclusive** | Community proxy contacts, multilingual templates |
| **Affordable** | DTMF-first call design, cost tracking |

---

## Data Relationships

```
School
  ├── Students (many)
  ├── Users (many)
  ├── Attendance records (many)
  └── LearningAssessments (many)

Student
  ├── parentContacts (embedded array)
  ├── Attendance records (many)
  ├── CallLogs (many)
  ├── LearningAssessments (many)
  └── RiskScore (one)

Attendance
  ├── Student (one)
  ├── School (one)
  ├── markedBy User (one)
  └── CallLog (one, optional)

CallLog
  ├── Student (one)
  └── Attendance (one, optional)

LearningAssessment
  ├── Student (one)
  ├── School (one)
  └── assessedBy User (one)

RiskScore
  ├── Student (one, unique)
  └── scoreHistory (embedded array)

MessageTemplate
  └── (standalone, referenced by code)
```

---

## Key Indexes

### Performance Indexes
- Student: school + active, enrollmentStatus, gender, disabilityStatus, locationType
- Attendance: student + date (unique), school + date, followUpRequired
- CallLog: student + timePlaced, phone, result
- LearningAssessment: student + assessmentDate, school + assessmentDate
- RiskScore: student (unique), riskLevel, riskScore

### Search Indexes
- School: name (text)
- Student: firstName + lastName (text)
- MessageTemplate: name + content (text)

---

## Usage Examples

### Create a Student (Out-of-School)
```javascript
const student = await Student.create({
  firstName: 'Abena',
  lastName: 'Mensah',
  dateOfBirth: '2010-05-15',
  gender: 'Female',
  enrollmentStatus: 'never_enrolled',
  disabilityStatus: 'None',
  locationType: 'Rural',
  parentContacts: [{
    phone: '+233241234567',
    relation: 'Mother',
    name: 'Ama Mensah',
    preferredLanguage: 'Twi'
  }],
  registrationSource: 'Community Outreach'
});
```

### Mark Attendance and Trigger Call
```javascript
const attendance = await Attendance.create({
  student: studentId,
  school: schoolId,
  date: new Date(),
  status: 'absent',
  reason: 'unknown',
  markedBy: teacherId,
  followUpRequired: true
});

// This will trigger a call in the background job queue
```

### Record Learning Assessment
```javascript
const assessment = await LearningAssessment.create({
  student: studentId,
  school: schoolId,
  literacyLevel: 'below_benchmark',
  numeracyLevel: 'meeting_benchmark',
  literacyDetails: {
    canReadSimpleSentence: false,
    canWriteName: true,
    canIdentifyLetters: true,
    readingFluency: 'low'
  },
  assessedBy: teacherId,
  recommendations: ['Extra Reading Practice', 'Parental Support']
});
```

### Calculate Risk Score
```javascript
const riskScore = await RiskScore.create({
  student: studentId,
  riskScore: 0.65,
  features: {
    absences30Days: 12,
    contactVerified: false,
    literacyLevel: 'below_benchmark',
    hasDisability: false,
    locationType: 'Rural'
  }
});
// Auto-calculates riskLevel = 'high'
// Auto-recommends interventions
```

### Render Message Template
```javascript
const template = await MessageTemplate.findByCode('ABSENCE_NOTIFY', 'Twi');
const message = template.render({
  parent_name: 'Ama',
  child_name: 'Abena',
  date: 'Monday'
});
// Output: "Meda wo akye Ama. Abena anhyia sukuu nnɛ Monday..."
```

---

## Validation Rules

### Student
- At least one parent contact required for enrolled students
- Date of birth required
- Enrollment status required
- Disability status required
- Location type required

### Attendance
- One record per student per day (unique index)
- Student and school required
- Marked by user required

### LearningAssessment
- Student, school, assessed by required
- Literacy and numeracy levels required
- Overall level auto-calculated

### RiskScore
- One score per student (unique)
- Risk score 0-1 required
- Risk level auto-calculated from score

---

## Next Steps (Phase 3)

1. Create REST API endpoints for all models
2. Add authentication middleware
3. Implement CRUD operations
4. Add data validation
5. Create bulk import/export
6. Add analytics aggregations

---

**Models Complete**: 8/8 ✅  
**UNICEF Requirements**: All covered ✅  
**Ready for**: Phase 3 - REST APIs
