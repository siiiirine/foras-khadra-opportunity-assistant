from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class OpportunityRequest(BaseModel):
    description: str

class URLRequest(BaseModel):
    url: str

class UserProfile(BaseModel):
    education_level: str
    country: str
    skills: List[str]
    english_proficiency: str
    years_experience: Optional[int] = 0
    field_of_study: Optional[str] = None
    additional_info: Optional[str] = None

class MatchRequest(BaseModel):
    description: str
    user_profile: UserProfile

class MatchResponse(BaseModel):
    match_score: int
    eligible: bool
    strengths: List[str]
    missing_requirements: List[str]
    recommendations: List[str]
    detailed_breakdown: Dict[str, Any]

class OpportunityResponse(BaseModel):
    title: str
    summary: str
    category: str
    tags: List[str]
    reading_time: str
    confidence: int
    error: Optional[str] = None
    match_result: Optional[MatchResponse] = None