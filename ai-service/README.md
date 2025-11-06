# EduLink AI Service (Flask + Python)

AI and analytics service for EduLink Ghana.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Configure your `.env` file with:
   - MongoDB connection string
   - Redis connection string

6. Start development server:
```bash
python app.py
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### AI Services
- `POST /ai/detect-language` - Detect language from audio
- `POST /ai/score-risk` - Calculate dropout risk score
- `GET /ai/recommendations/<student_id>` - Get learning recommendations

## Project Structure

```
ai-service/
├── services/           # AI service modules
├── models/            # ML model definitions
├── utils/             # Utility functions
├── routes/            # Flask routes
├── app.py             # Entry point
├── requirements.txt
└── .env.example
```

## Features

### Language Detection (MVP)
- Currently uses phone prefix fallback
- Will be enhanced with ML model after pilot data collection

### Risk Scoring (MVP)
- Rule-based scoring using:
  - Absence rate (last 30 days)
  - Contact verification status
  - Learning assessment scores
- Will be enhanced with XGBoost model after pilot

### Recommendations (MVP)
- Template-based recommendations
- Will be enhanced with ML-powered personalization

## Development

The service uses:
- **Flask** for HTTP server
- **PyTorch** + **Transformers** for ML models
- **Librosa** for audio processing
- **XGBoost** for risk prediction

## Testing

```bash
pytest
```

## Deployment

See main project README for deployment instructions.
