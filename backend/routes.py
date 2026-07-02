from fastapi import APIRouter, HTTPException
from models import OpportunityRequest, OpportunityResponse, URLRequest, MatchRequest, MatchResponse, UserProfile
from ai import AIAnalyzer
import asyncio
import httpx

router = APIRouter()
_ai_analyzer = None


def get_ai_analyzer():
    global _ai_analyzer
    if _ai_analyzer is None:
        try:
            _ai_analyzer = AIAnalyzer()
        except ValueError as exc:
            raise HTTPException(status_code=503, detail=str(exc))
    return _ai_analyzer

@router.post("/api/analyze", response_model=OpportunityResponse)
async def analyze_opportunity(request: OpportunityRequest):
    try:
        if not request.description or len(request.description.strip()) < 10:
            raise HTTPException(status_code=400, detail="Description too short")
        
        ai_analyzer = get_ai_analyzer()
        result = await ai_analyzer.analyze(request.description)
        return OpportunityResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        return OpportunityResponse(
            title="",
            summary="",
            category="",
            tags=[],
            reading_time="",
            confidence=0,
            error=str(e)
        )

@router.post("/api/analyze-with-match", response_model=OpportunityResponse)
async def analyze_with_match(request: MatchRequest):
    try:
        if not request.description or len(request.description.strip()) < 10:
            raise HTTPException(status_code=400, detail="Description too short")
        
        ai_analyzer = get_ai_analyzer()
        
        result = await ai_analyzer.analyze(request.description)
        user_profile_dict = request.user_profile.model_dump()
        match_result = await ai_analyzer.analyze_match(
            request.description, 
            user_profile_dict
        )
        return OpportunityResponse(
            **result,
            match_result=MatchResponse(**match_result)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return OpportunityResponse(
            title="",
            summary="",
            category="",
            tags=[],
            reading_time="",
            confidence=0,
            error=str(e)
        )

@router.post("/api/fetch-url")
async def fetch_url_content(request: URLRequest):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(request.url)
            response.raise_for_status()
            
            content = response.text
            import re
            content = re.sub(r'<script.*?>.*?</script>', '', content, flags=re.DOTALL)
            content = re.sub(r'<style.*?>.*?</style>', '', content, flags=re.DOTALL)
            content = re.sub(r'<[^>]+>', ' ', content)
            content = re.sub(r'\s+', ' ', content).strip()
            content = content[:5000]
            
            return {"content": content, "success": True}
    except Exception as e:
        return {"content": "", "success": False, "error": str(e)}