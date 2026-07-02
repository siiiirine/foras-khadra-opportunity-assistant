# AI Opportunity Assistant

An AI-powered web application that helps users quickly understand scholarships, internships, jobs, competitions, and other opportunities through intelligent analysis and personalized insights.

The application uses Large Language Models (LLMs) through OpenRouter/OpenAI to analyze opportunity descriptions, with Google Gemini and local analysis available as fallback options. It transforms lengthy opportunity descriptions into structured information that is easier to understand and evaluate.

---

## Features

### AI Analysis

- AI-generated opportunity title
- Concise opportunity summary
- Automatic category classification
- Smart tag generation
- Estimated reading time
- Confidence score

### Personalized Insights

- AI-powered opportunity matching based on the user's profile
- Eligibility assessment
- Matching strengths
- Missing skills or requirements
- AI-generated recommendations to improve application success

### User Experience

- Analyze text from direct input
- Upload text files
- Analyze content from URLs
- Match opportunities against a user profile
- Analysis history
- Copy results to clipboard
- Export analysis as JSON or PDF
- Character and word counter
- Responsive interface
- Dark mode
- Loading and error handling

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| AI | OpenRouter API (OpenAI-compatible), Google Gemini, Local fallback |
| HTTP Client | Axios |

---

## Project Structure

```text
.
├── backend/
│   ├── ai.py
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/siiiirine/foras-khadra-opportunity-assistant.git
cd foras-khadra-opportunity-assistant
```

---

### 2. Backend Setup

Create a virtual environment:

```bash
cd backend
python -m venv venv
```

Activate it.

**Windows**

```bash
venv\Scripts\activate
```

**Linux/macOS**

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional
AI_PROVIDER=openrouter
```

Run the backend:

```bash
python main.py
```

> If your project uses Uvicorn directly, replace the last command with:
>
> ```bash
> uvicorn main:app --reload
> ```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

(Optional) Create a frontend `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

---

## Usage

1. Paste an opportunity description, upload a text file, or provide an opportunity URL.
2. Click **Analyze with AI**.
3. View the generated:
   - Opportunity title
   - Summary
   - Category
   - Tags
   - Estimated reading time
   - Confidence score
4. (Optional) Enter your profile information to receive:
   - Opportunity Match Score
   - Eligibility assessment
   - Matching strengths
   - Missing requirements
   - Personalized AI recommendations

---

## API

### POST `/api/analyze`

#### Request

```json
{
  "description": "Opportunity description..."
}
```

#### Response

```json
{
  "title": "Google Summer Internship 2026",
  "summary": "A short summary of the opportunity.",
  "category": "Internship",
  "tags": [
    "Google",
    "Software",
    "Internship",
    "Students",
    "Remote"
  ],
  "reading_time": "2 min read",
  "confidence": 95
}
```

---

### POST `/api/analyze-with-match`

#### Request

```json
{
  "description": "Opportunity description...",
  "user_profile": {
    "education_level": "Bachelor",
    "country": "Morocco",
    "skills": [
      "Python",
      "React"
    ],
    "english_proficiency": "B2",
    "years_experience": 2,
    "field_of_study": "Computer Science",
    "additional_info": "Optional notes"
  }
}
```

#### Response

```json
{
  "title": "Google Summer Internship 2026",
  "summary": "A short summary of the opportunity.",
  "category": "Internship",
  "tags": [
    "Google",
    "Software",
    "Internship",
    "Students",
    "Remote"
  ],
  "reading_time": "2 min read",
  "confidence": 95,
  "match_result": {
    "match_score": 82,
    "eligible": true,
    "strengths": [
      "Strong Python skills",
      "Relevant academic background"
    ],
    "missing_requirements": [
      "TensorFlow experience"
    ],
    "recommendations": [
      "Highlight your GitHub projects.",
      "Include machine learning coursework."
    ]
  }
}
```

---

### POST `/api/fetch-url`

#### Request

```json
{
  "url": "https://example.com/opportunity"
}
```

#### Response

```json
{
  "content": "Extracted page content...",
  "success": true
}
```

---

## How It Works

1. The user submits an opportunity description by pasting text, uploading a file, or providing a URL.
2. The backend sends the content to an LLM through OpenRouter/OpenAI when configured.
3. If the primary provider is unavailable, the application automatically falls back to Google Gemini or a local analysis pipeline.
4. The AI extracts structured information, including the title, summary, category, tags, estimated reading time, and confidence score.
5. The backend validates the generated data before returning it to the frontend.
6. The frontend presents the results in a clean, user-friendly interface.

For personalized insights, the application compares the user's profile with the opportunity requirements to estimate compatibility, identify strengths, highlight missing qualifications, and generate actionable recommendations.

---

## Future Improvements

- Semantic opportunity search
- AI chatbot for opportunity Q&A
- Resume/CV upload with automatic profile extraction
- Personalized opportunity recommendations
- Multi-language support

---

## Acknowledgements

This project was developed as part of the **Foras Khadra AI Technical Assessment**, demonstrating the integration of AI into a real-world web application to enhance opportunity discovery and decision-making.
