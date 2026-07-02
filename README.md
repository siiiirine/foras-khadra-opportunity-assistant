# AI Opportunity Assistant

An AI-powered web application that helps users quickly understand scholarships, internships, jobs, competitions, and other opportunities through intelligent analysis and personalized insights.

The application leverages a Large Language Model (LLM) to transform lengthy opportunity descriptions into structured information, making it easier to evaluate opportunities and decide whether they are a good fit.

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

- Opportunity Match Score based on the user's profile
- Eligibility assessment
- Matching strengths
- Missing skills or requirements
- AI-generated recommendations to improve application success

### User Experience

- Analyze text from direct input
- Upload text files
- Analyze content from URLs
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
| AI | OpenRouter API (OpenAI-compatible LLM) |
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
git clone https://github.com/your-username/ai-opportunity-assistant.git
cd ai-opportunity-assistant
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

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENROUTER_API_KEY=your_api_key
```

Run the backend:

```bash
python main.py
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Usage

1. Paste an opportunity description, upload a text file, or provide a URL.
2. Click **Analyze with AI**.
3. View the generated:
   - Title
   - Summary
   - Category
   - Tags
   - Reading time
   - Confidence score
4. (Optional) Enter your profile information to receive:
   - Opportunity Match Score
   - Eligibility assessment
   - Personalized recommendations

---

## API

### POST `/api/analyze`

### Request

```json
{
  "description": "Opportunity description..."
}
```

### Response

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

## How It Works

1. The user submits an opportunity description through the web interface.
2. The backend sends the content to a Large Language Model via the OpenRouter API.
3. The AI analyzes the opportunity and extracts structured information.
4. The backend validates and formats the response.
5. The frontend displays the analysis in an easy-to-read interface.

For personalized insights, the AI compares the user's profile with the opportunity requirements to generate a match score, identify strengths and missing qualifications, and provide recommendations.

---

## Future Improvements

- Semantic opportunity search
- AI chatbot for opportunity Q&A
- Resume/CV upload and matching
- Personalized opportunity recommendations
- Multi-language support

---

## Acknowledgements

This project was developed as part of the **Foras Khadra AI Technical Assessment**, demonstrating the integration of AI into a real-world web application to enhance the opportunity discovery experience.