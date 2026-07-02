import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {api_key[:10]}..." if api_key else "API Key NOT found!")

if api_key:
    try:
        genai.configure(api_key=api_key)
        models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
        
        for model_name in models:
            try:
                print(f"\nTesting {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Say hello in one word")
                print(f"✅ {model_name} is working! Response: {response.text}")
                break
            except Exception as e:
                print(f"❌ {model_name} failed: {str(e)}")
                
    except Exception as e:
        print("❌ API Key error:", str(e))