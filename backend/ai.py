import json
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
GEMINI_MODEL = "gemini-1.5-flash"

load_dotenv(dotenv_path=ENV_PATH, override=False)


def _clean_value(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    cleaned = value.strip().strip('"').strip("'")
    return cleaned or None


class AIAnalyzer:
    def __init__(self):
        load_dotenv(dotenv_path=ENV_PATH, override=False)

        self.openai_api_key = _clean_value(os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY"))
        self.gemini_api_key = _clean_value(os.getenv("GEMINI_API_KEY"))
        self.provider = self._resolve_provider()
        self.client = None
        self.gemini_model = None

        if not self.openai_api_key and not self.gemini_api_key:
            self.provider = "local"
            print("⚠️ No API keys found. Using local analysis mode.")
            return

        if self.openai_api_key and self.provider in {"openai", "openrouter"}:
            os.environ["OPENAI_API_KEY"] = self.openai_api_key
            if self.provider == "openrouter":
                self.client = OpenAI(api_key=self.openai_api_key, base_url=OPENROUTER_BASE_URL)
            else:
                self.client = OpenAI(api_key=self.openai_api_key)
            print(f"✅ Connected to {self.provider.title()} API")

        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(GEMINI_MODEL)
            print(f"✅ Connected to Gemini API ({GEMINI_MODEL})")

        print(f"✅ API Key loaded from {ENV_PATH if ENV_PATH.exists() else 'environment'}")

    def _resolve_provider(self) -> str:
        provider = os.getenv("AI_PROVIDER", "").strip().lower()
        if provider in {"openai", "openrouter"}:
            return provider
        if os.getenv("OPENROUTER_API_KEY"):
            return "openrouter"
        return "openai"

    def _build_prompt(self, description: str) -> str:
        return f"Analyze this opportunity:\n\n{description}"

    def _parse_response(self, content: str) -> Dict[str, Any]:
        if not content:
            raise ValueError("Empty AI response")

        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            content = match.group(0)

        result = json.loads(content.strip())
        defaults = {
            "title": "Opportunity Overview",
            "summary": "No summary generated.",
            "category": "Workshop",
            "tags": [],
            "reading_time": "1 min read",
            "confidence": 50,
        }
        for key, value in defaults.items():
            result.setdefault(key, value)

        if not isinstance(result.get("tags"), list):
            result["tags"] = [str(result["tags"])] if result.get("tags") else []

        return result

    def _normalize_match_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        defaults = {
            "match_score": 0,
            "eligible": False,
            "strengths": [],
            "missing_requirements": [],
            "recommendations": [],
            "detailed_breakdown": {},
        }

        normalized = {**defaults, **(data or {})}

        normalized["match_score"] = max(0, min(100, int(normalized.get("match_score", 0) or 0)))
        normalized["eligible"] = bool(normalized.get("eligible", False))
        normalized["strengths"] = [str(item) for item in normalized.get("strengths", []) if str(item).strip()]
        normalized["missing_requirements"] = [
            str(item) for item in normalized.get("missing_requirements", []) if str(item).strip()
        ]
        normalized["recommendations"] = [
            str(item) for item in normalized.get("recommendations", []) if str(item).strip()
        ]
        if not isinstance(normalized.get("detailed_breakdown"), dict):
            normalized["detailed_breakdown"] = {}

        education_missing = [
            item
            for item in normalized["missing_requirements"]
            if re.search(r"education|degree|bachelor|master|phd|postdoc|high school", item, re.IGNORECASE)
        ]
        education_strengths = [
            item
            for item in normalized["strengths"]
            if re.search(r"education requirement|degree matches|matches the education", item, re.IGNORECASE)
        ]

        non_education_missing = [
            item
            for item in normalized["missing_requirements"]
            if item not in education_missing
        ]
        non_education_recommendations = [
            item
            for item in normalized["recommendations"]
            if not re.search(r"education|degree|bachelor|master|phd|postdoc|high school", item, re.IGNORECASE)
        ]

        if education_strengths:
            normalized["missing_requirements"] = non_education_missing
            normalized["recommendations"] = non_education_recommendations
        elif education_missing:
            normalized["missing_requirements"] = ["Education requirement not fully met"] + non_education_missing
            normalized["recommendations"] = ["Review the listed education requirement"] + non_education_recommendations

        normalized["strengths"] = list(dict.fromkeys(normalized["strengths"]))
        normalized["missing_requirements"] = list(dict.fromkeys(normalized["missing_requirements"]))
        normalized["recommendations"] = list(dict.fromkeys(normalized["recommendations"]))

        return normalized

    def _should_fallback_from_openai(self, error: Exception) -> bool:
        message = str(error).lower()
        return any(
            token in message
            for token in [
                "insufficient_quota",
                "quota",
                "invalid_api_key",
                "incorrect api key",
                "authentication_error",
                "unauthorized",
                "401",
                "429",
            ]
        )

    def _analyze_locally(self, description: str) -> Dict[str, Any]:
        text = re.sub(r"\s+", " ", description).strip()
        lowered = text.lower()
        sentences = re.split(r"(?<=[.!?])\s+", text) if text else []
        summary = " ".join(sentences[:2]).strip() if sentences else text
        if not summary:
            summary = "Opportunity details unavailable."

        category_rules = [
            ("Scholarship", ["scholarship", "grant", "fellowship", "funding", "tuition"]),
            ("Internship", ["internship", "intern"]),
            ("Job", ["job", "career", "hiring", "position", "role", "vacancy"]),
            ("Competition", ["competition", "contest", "challenge", "hackathon"]),
            ("Conference", ["conference", "summit", "symposium", "forum"]),
            ("Volunteer", ["volunteer", "community service", "ngo"]),
            ("Training", ["training", "bootcamp", "course", "learn", "lesson"]),
            ("Exchange Program", ["exchange", "study abroad", "mobility", "abroad"]),
            ("Research", ["research", "phd", "postdoc", "laboratory", "lab"]),
            ("Workshop", ["workshop", "hands-on", "hands on"]),
        ]

        category = "Workshop"
        for category_name, keywords in category_rules:
            if any(keyword in lowered for keyword in keywords):
                category = category_name
                break

        words = re.findall(r"[A-Za-z][A-Za-z\-]{2,}", lowered)
        stopwords = {
            "the", "and", "for", "with", "from", "this", "that", "are", "you", "your", "about",
            "opportunity", "opportunities", "apply", "application", "open", "now", "program", "programs"
        }
        keywords = [word for word in words if word not in stopwords]
        tags = [term for term, _ in Counter(keywords).most_common(8)]
        if not tags:
            tags = ["opportunity", "deadline", "career", "learning", "application"]

        title = sentences[0] if sentences else text or "Opportunity Overview"
        title = re.sub(r"\b(we|you|they|their|our|this|that|these|those)\b", "", title, flags=re.IGNORECASE)
        title = re.sub(r"\s+", " ", title).strip(" .:-")
        if len(title) > 90:
            title = title[:87].rsplit(" ", 1)[0] + "..."

        reading_words = max(1, len(words))
        reading_minutes = max(1, round(reading_words / 180))

        return {
            "title": title or "Opportunity Overview",
            "summary": summary,
            "category": category,
            "tags": tags[:5],
            "reading_time": f"{reading_minutes} min read",
            "confidence": 35,
        }

    def _analyze_with_openai(self, description: str) -> Dict[str, Any]:
        if not self.client:
            raise ValueError("OpenAI client is not configured")

        response = self.client.chat.completions.create(
            model="gpt-4o-mini" if self.provider == "openai" else "openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": self._build_prompt(description)},
            ],
            temperature=0.3,
            max_tokens=600,
        )
        content = (response.choices[0].message.content or "").strip()
        print(f"📝 Raw response: {content[:200]}...")
        return self._parse_response(content)

    def _analyze_with_gemini(self, description: str) -> Dict[str, Any]:
        if not self.gemini_model:
            raise ValueError("Gemini client is not configured")

        response = self.gemini_model.generate_content([self.system_prompt, self._build_prompt(description)])
        content = (response.text or "").strip()
        print(f"📝 Raw Gemini response: {content[:200]}...")
        return self._parse_response(content)

    def _analyze_match_locally(self, description: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        text = description.lower()
        profile = user_profile

        score = 50
        strengths: List[str] = []
        missing: List[str] = []
        recommendations: List[str] = []

        user_edu = str(profile.get("education_level", "")).lower()

        edu_rank = {
            "high school": 1,
            "bachelor": 2,
            "master": 3,
            "phd": 4,
            "postdoc": 5,
        }
        edu_keywords = {
            "high school": ["high school", "secondary school"],
            "bachelor": ["bachelor", "bsc", "ba", "undergraduate"],
            "master": ["master", "msc", "ma", "graduate", "postgraduate"],
            "phd": ["phd", "doctorate", "doctoral"],
            "postdoc": ["postdoc", "post-doctoral"],
        }

        required_level = None
        for edu_level, keywords in edu_keywords.items():
            if any(kw in text for kw in keywords):
                if required_level is None or edu_rank[edu_level] > edu_rank[required_level]:
                    required_level = edu_level

        user_level = None
        for level_name in ["postdoc", "phd", "master", "bachelor", "high school"]:
            if level_name in user_edu:
                user_level = level_name
                break

        if required_level:
            required_rank = edu_rank[required_level]
            user_rank = edu_rank.get(user_level or "", 0)

            if user_rank >= required_rank and user_rank > 0:
                score += 10
                strengths.append(f"Your {profile.get('education_level')} matches the education requirement")
            else:
                missing.append(f"Education requirement: {required_level.title()}")

        user_skills = [s.lower() for s in profile.get("skills", [])]
        if user_skills:
            skill_matches = [skill for skill in user_skills if skill in text]
            if skill_matches:
                score += min(15, len(skill_matches) * 5)
                strengths.append(f"Your skills match: {', '.join(skill_matches[:3])}")
            else:
                extracted_skills = re.findall(
                    r"\b(?:python|javascript|java|sql|react|angular|aws|docker|git|agile|scrum|project management|leadership|communication|teamwork)\b",
                    text,
                )
                if extracted_skills:
                    missing.append(f"Consider learning: {', '.join(sorted(set(extracted_skills))[:3])}")

        user_eng = str(profile.get("english_proficiency", "")).lower()
        if user_eng in ["fluent", "native"]:
            if "english" in text or "language" in text:
                score += 10
                strengths.append("Strong English proficiency")
        elif user_eng in ["intermediate", "advanced"]:
            if "english" in text:
                score += 5
                strengths.append("Good English proficiency")
        else:
            if "english" in text:
                missing.append("Higher English proficiency may be required")

        user_exp = int(profile.get("years_experience", 0) or 0)
        if user_exp > 0 and ("year" in text or "experience" in text):
            exp_matches = re.findall(r"(\d+)\s*(?:years?|yrs?)\s*(?:experience|of experience)", text)
            if exp_matches:
                required_exp = int(exp_matches[0])
                if user_exp >= required_exp:
                    score += 10
                    strengths.append(f"Your {user_exp} years of experience meets the requirement")
                else:
                    missing.append(f"Need {required_exp - user_exp} more years of experience")

        user_country = str(profile.get("country", "")).lower()
        if user_country:
            country_patterns = ["germany", "usa", "uk", "canada", "australia", "france"]
            for country in country_patterns:
                if country in text and country == user_country:
                    score += 5
                    strengths.append(f"Your location in {user_country} is a match")
                elif country in text and country != user_country:
                    missing.append(f"Located in a different country than preferred ({country})")

        score = max(0, min(100, score))

        if score < 70:
            recommendations.append("Review the eligibility criteria carefully")
            if missing:
                recommendations.append(f"Focus on: {', '.join(missing[:2])}")

        field_of_study = str(profile.get("field_of_study", ""))
        if field_of_study and field_of_study.lower() in text:
            recommendations.append(f"Highlight your {field_of_study} background in your application")

        if not strengths:
            strengths.append("Your profile matches some basic requirements")

        return {
            "match_score": score,
            "eligible": score >= 60,
            "strengths": strengths[:4],
            "missing_requirements": missing[:4],
            "recommendations": recommendations[:3] or ["Submit a strong application to improve your chances"],
            "detailed_breakdown": {
                "education": score > 50,
                "skills": len([s for s in user_skills if s in text]) > 0,
                "experience": True,
                "location": True,
            },
        }

    def _analyze_match_with_ai(self, description: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        profile_text = f"""
User Profile:
- Education: {user_profile.get('education_level', 'Not specified')}
- Country: {user_profile.get('country', 'Not specified')}
- Skills: {', '.join(user_profile.get('skills', ['Not specified']))}
- English Proficiency: {user_profile.get('english_proficiency', 'Not specified')}
- Years of Experience: {user_profile.get('years_experience', 0)}
- Field of Study: {user_profile.get('field_of_study', 'Not specified')}
- Additional Info: {user_profile.get('additional_info', 'None')}
"""

        match_prompt = f"""
You are an expert admissions officer and career counselor. Analyze how well the user's profile matches the opportunity requirements.

Opportunity Description:
{description}

{profile_text}

Return ONLY valid JSON in this exact format:
{{
  "match_score": 85,
  "eligible": true,
  "strengths": [
    "Your Master's degree matches the education requirement",
    "Your Python skills are directly relevant",
    "Your 3 years of experience meets the requirement"
  ],
  "missing_requirements": [
    "Consider improving your French language skills",
    "Additional research experience would strengthen your application"
  ],
  "recommendations": [
    "Highlight your Python projects in your application",
    "Consider taking an online French course",
    "Reach out to alumni for application tips"
  ],
  "detailed_breakdown": {{
    "education": 90,
    "skills": 85,
    "experience": 75,
    "language": 70,
    "location": 80
  }}
}}

Be honest and constructive. If the user is not eligible, clearly explain why.
"""

        try:
            if self.client:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini" if self.provider == "openai" else "openai/gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You analyze candidate-opportunity matches. Return only valid JSON."},
                        {"role": "user", "content": match_prompt},
                    ],
                    temperature=0.3,
                    max_tokens=800,
                )
                content = response.choices[0].message.content or ""
                return self._normalize_match_response(self._parse_response(content))

            if self.gemini_model:
                response = self.gemini_model.generate_content(match_prompt)
                content = response.text or ""
                return self._normalize_match_response(self._parse_response(content))

            return self._analyze_match_locally(description, user_profile)
        except Exception as exc:
            print(f"⚠️ AI match analysis failed: {str(exc)}")
            return self._analyze_match_locally(description, user_profile)

    async def analyze(self, description: str) -> Dict[str, Any]:
        try:
            print("🔄 Analyzing opportunity...")
            if self.client:
                try:
                    result = self._analyze_with_openai(description)
                except Exception as openai_error:
                    print(f"⚠️ OpenAI analysis failed: {str(openai_error)}")
                    if self.gemini_model and self._should_fallback_from_openai(openai_error):
                        print("🔁 Falling back to Gemini...")
                        try:
                            result = self._analyze_with_gemini(description)
                        except Exception as gemini_error:
                            print(f"⚠️ Gemini fallback failed: {str(gemini_error)}")
                            result = self._analyze_locally(description)
                    elif self._should_fallback_from_openai(openai_error):
                        print("🔁 Falling back to local analysis...")
                        result = self._analyze_locally(description)
                    else:
                        raise
            elif self.gemini_model:
                try:
                    result = self._analyze_with_gemini(description)
                except Exception as gemini_error:
                    print(f"⚠️ Gemini analysis failed: {str(gemini_error)}")
                    result = self._analyze_locally(description)
            else:
                result = self._analyze_locally(description)

            print("✅ Analysis complete!")
            return result
        except Exception as exc:
            print(f"❌ Error: {str(exc)}")
            raise Exception(f"Unable to analyze opportunity: {str(exc)}")

    async def analyze_match(self, description: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        try:
            print("🔄 Analyzing match...")
            result = self._analyze_match_with_ai(description, user_profile)
            print("✅ Match analysis complete!")
            return result
        except Exception as exc:
            print(f"❌ Match analysis error: {str(exc)}")
            return {
                "match_score": 0,
                "eligible": False,
                "strengths": ["Unable to analyze match"],
                "missing_requirements": ["Please try again"],
                "recommendations": ["Contact support for assistance"],
                "detailed_breakdown": {},
            }

    system_prompt = """You are an expert content editor for an international opportunities platform.

Analyze the opportunity and return ONLY valid JSON in this exact format:
{
  "title": "Professional Title Here",
  "summary": "2-3 sentence summary of the opportunity",
  "category": "Scholarship",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "reading_time": "2 min read",
  "confidence": 94
}

Categories must be one of: Scholarship, Internship, Job, Competition, Conference, Volunteer, Training, Exchange Program, Research, Workshop
Tags: 5-8 short, relevant tags (no duplicates)
Confidence: 0-100

Return ONLY the JSON, no explanations, no markdown, no other text."""
