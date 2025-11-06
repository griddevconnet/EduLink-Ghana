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

## Coming Soon

### Students API
- `POST /api/students` - Create student
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/out-of-school` - Get out-of-school children

### Schools API
- `POST /api/schools` - Create school
- `GET /api/schools` - List schools
- `GET /api/schools/:id` - Get school
- `PUT /api/schools/:id` - Update school

### Attendance API
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/student/:id` - Get student attendance
- `GET /api/attendance/school/:id` - Get school attendance

### Learning Assessments API
- `POST /api/assessments` - Record assessment
- `GET /api/assessments/student/:id` - Get student assessments
- `GET /api/assessments/school/:id` - Get school summary

### Analytics API
- `GET /api/analytics/disaggregated` - Disaggregated data reports
- `GET /api/analytics/school/:id` - School dashboard
- `GET /api/analytics/district/:name` - District summary

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
