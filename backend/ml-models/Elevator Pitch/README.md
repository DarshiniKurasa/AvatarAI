# Resume Pitch Generator API

A FastAPI service that generates professional elevator pitches from resume data in JSON format.

## Features

- Generate 1-minute elevator pitches from resume JSON
- Simple REST API for easy integration
- CORS enabled for frontend access
- File upload support for testing
- Health check endpoint

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### 1. Generate Pitch from JSON

- **URL**: `/generate-pitch`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**: 
  ```json
  {
    "data": {
      "attributes": {
        "result": {
          // Your resume JSON data here
        }
      }
    }
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "pitch": "Hi, I'm John Doe...",
    "word_count": 142
  }
  ```

### 2. Generate Pitch from File (for testing)

- **URL**: `/generate-pitch-from-file`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (JSON file)
- **Success Response**: Same as above

### 3. Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**: `{"status": "healthy"}`

## Integration with Node.js

Here's how to call this API from your Node.js backend:

```javascript
const axios = require('axios');

async function generatePitch(resumeData) {
  try {
    const response = await axios.post('http://localhost:8000/generate-pitch', {
      data: resumeData
    });
    return response.data.pitch;
  } catch (error) {
    console.error('Error generating pitch:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
const resumeData = {
  // ... your resume data
};

generatePitch(resumeData)
  .then(pitch => console.log(pitch))
  .catch(console.error);
```

## Testing with cURL

```bash
# Test with JSON data
curl -X POST http://localhost:8000/generate-pitch \
  -H "Content-Type: application/json" \
  -d '{"data": {"attributes": {"result": {"candidate_name": "John Doe"}}}}'

# Test with file upload
curl -X POST http://localhost:8000/generate-pitch-from-file \
  -F "file=@resume.json"
```

## Deployment

For production deployment, consider using:
- Gunicorn with Uvicorn workers
- Environment variables for configuration
- Proper CORS settings
- HTTPS with a reverse proxy (Nginx, Caddy, etc.)
