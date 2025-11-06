# EduLink Backend (Node.js + Express)

Backend API service for EduLink Ghana.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - MongoDB connection string
   - Redis connection string
   - JWT secret
   - Telephony API keys

4. Start development server:
```bash
npm run dev
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming in Phase 3)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-phone` - Verify phone with OTP

### Students (Coming in Phase 3)
- `POST /api/students` - Register student
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `GET /api/students/out-of-school` - List out-of-school children

### More endpoints coming soon...

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── jobs/            # Background jobs
│   └── server.js        # Entry point
├── logs/                # Log files
├── package.json
└── .env.example
```

## Environment Variables

See `.env.example` for all required environment variables.

## Development

The server uses:
- **Express** for HTTP server
- **Mongoose** for MongoDB ODM
- **BullMQ** for job queues
- **Winston** for logging
- **JWT** for authentication

## Testing

```bash
npm test
```

## Deployment

See main project README for deployment instructions.
