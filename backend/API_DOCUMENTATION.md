# EduLink Ghana API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Mensah",
  "phone": "+233241234567",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher",
  "school": "507f1f77bcf86cd799439011"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your phone number.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Mensah",
      "phone": "+233241234567",
      "role": "teacher",
      "phoneVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "verificationRequired": true
  }
}
```

---

### Login
**POST** `/auth/login`

Login with phone and password.

**Request Body:**
```json
{
  "phone": "+233241234567",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Mensah",
      "phone": "+233241234567",
      "role": "teacher",
      "school": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Accra Primary School",
        "region": "Greater Accra"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Verify Phone
**POST** `/auth/verify-phone`

Verify phone number with 6-digit code.

**Request Body:**
```json
{
  "phone": "+233241234567",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": {
    "phoneVerified": true
  }
}
```

---

### Resend Verification
**POST** `/auth/resend-verification`

Request a new verification code.

**Request Body:**
```json
{
  "phone": "+233241234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "codeSent": true
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Get currently authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Mensah",
      "phone": "+233241234567",
      "email": "john@example.com",
      "role": "teacher",
      "school": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Accra Primary School"
      },
      "phoneVerified": true,
      "active": true
    }
  }
}
```

---

### Update Profile
**PUT** `/auth/me`

Update current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Mensah",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

### Change Password
**POST** `/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

---

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset code.

**Request Body:**
```json
{
  "phone": "+233241234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the phone number exists, a reset code will be sent",
  "data": {}
}
```

---

### Reset Password
**POST** `/auth/reset-password`

Reset password with code.

**Request Body:**
```json
{
  "phone": "+233241234567",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password.",
  "data": {}
}
```

---

### Logout
**POST** `/auth/logout`

Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "phone",
      "message": "Please provide a valid phone number",
      "value": "invalid"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid token. Please authenticate again."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied. Required role: admin"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## User Roles

| Role | Level | Permissions |
|------|-------|-------------|
| `teacher` | 1 | View own school data, mark attendance |
| `headteacher` | 2 | Manage own school, view reports |
| `district_officer` | 3 | View district data, generate reports |
| `admin` | 4 | Manage multiple schools, system config |
| `national_admin` | 5 | Full system access |

---

## Schools API ✅

### Create School
**POST** `/api/schools`
**Access:** Admin only

**Request Body:**
```json
{
  "name": "Accra Primary School",
  "region": "Greater Accra",
  "district": "Accra Metro",
  "address": "123 Main St",
  "gps": {
    "latitude": 5.6037,
    "longitude": -0.1870
  },
  "type": "Primary",
  "ownership": "Public"
}
```

### List Schools
**GET** `/api/schools?region=Greater Accra&page=1&limit=20`

### Get School
**GET** `/api/schools/:id`

### Get School Statistics
**GET** `/api/schools/:id/stats`

---

## Students API ✅

### Create Student
**POST** `/api/students`
**Access:** Teacher, Headteacher, Admin

**Request Body:**
```json
{
  "firstName": "Kwame",
  "lastName": "Mensah",
  "dateOfBirth": "2010-05-15",
  "gender": "Male",
  "school": "507f1f77bcf86cd799439011",
  "class": "Primary 4",
  "enrollmentStatus": "enrolled",
  "parentContacts": [
    {
      "phone": "+233241234567",
      "name": "Ama Mensah",
      "relation": "Mother",
      "preferredLanguage": "Twi"
    }
  ]
}
```

### Get Out-of-School Children ⭐
**GET** `/api/students/out-of-school?region=Ashanti&gender=Female`

### Get Disaggregated Statistics ⭐
**GET** `/api/students/stats/disaggregated?school=:id`

---

## Attendance API ✅

### Mark Attendance
**POST** `/api/attendance`

**Request Body:**
```json
{
  "student": "507f1f77bcf86cd799439011",
  "school": "507f1f77bcf86cd799439012",
  "date": "2025-11-06",
  "status": "absent",
  "reason": "sick"
}
```

### Bulk Mark Attendance
**POST** `/api/attendance/bulk`

### Get Follow-up Required
**GET** `/api/attendance/follow-up?school=:id`

### Get Student Attendance
**GET** `/api/attendance/student/:studentId`

---

## Learning Assessments API ✅

### Create Assessment
**POST** `/api/assessments`

**Request Body:**
```json
{
  "student": "507f1f77bcf86cd799439011",
  "school": "507f1f77bcf86cd799439012",
  "literacyLevel": "meeting_benchmark",
  "literacyScore": 75,
  "numeracyLevel": "below_benchmark",
  "numeracyScore": 45
}
```

### Get Disaggregated Outcomes ⭐
**GET** `/api/assessments/stats/disaggregated?school=:id`

### Get Intervention Needed
**GET** `/api/assessments/intervention-needed?school=:id`

---

## IVR Webhooks API ✅

### Incoming Call
**POST** `/api/ivr/incoming`

### DTMF Input
**POST** `/api/ivr/dtmf`

### Call Status
**POST** `/api/ivr/status`

### Recording
**POST** `/api/ivr/recording`

---

## AI/ML API ✅

Base URL: `http://localhost:5001/ai`

### Detect Language
**POST** `/ai/detect-language`

**Request Body:**
```json
{
  "text": "Meda wo akye",
  "phone": "+233241234567",
  "region": "Ashanti"
}
```

**Response:**
```json
{
  "language": "Twi",
  "confidence": 0.92,
  "method": "combined"
}
```

### Score Risk
**POST** `/ai/score-risk`

**Request Body:**
```json
{
  "features": {
    "absences30Days": 12,
    "attendanceRate30Days": 60,
    "literacyLevel": "below_benchmark",
    "contactVerified": false
  }
}
```

**Response:**
```json
{
  "riskScore": 0.68,
  "riskLevel": "high",
  "recommendations": ["Parent Engagement Call", "Home Visit"]
}
```

### Get Recommendations
**POST** `/ai/recommendations`

**Request Body:**
```json
{
  "studentData": {...},
  "riskAssessment": {...},
  "budget": "medium"
}
```

---

## Testing

Use tools like Postman, Insomnia, or curl to test the API:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Mensah",
    "phone": "+233241234567",
    "password": "password123",
    "role": "teacher"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+233241234567",
    "password": "password123"
  }'

# Get current user (with token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Status**: Phase 3.1 Complete ✅  
**Next**: Student, School, and Attendance APIs
