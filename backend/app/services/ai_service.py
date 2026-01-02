import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def generate_tags(code_snippet: str, language: str): # <--- Added language param
    """
    Sends code to Groq and asks for context-aware tags.
    """
    try:
        # We give the AI strictly defined rules based on the user's selection
        prompt = f"Analyze the code snippet. The user claims it is {language}. If it is, generate technical tags. If it is NOT {language}, tag the actual language found. Return ONLY a comma-separated list of strings. Do not write sentences or explanations."
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt
                },
                {
                    "role": "user",
                    "content": code_snippet,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating tags: {e}")
        return "untagged"
    
def explain_code_snippet(code_snippet: str, language: str):
    """
    Sends code to Groq and asks for a beginner-friendly explanation.
    """
    try:
        prompt = f"You are a Senior Developer. Explain this {language} code to a junior developer. Be concise. Break it down step-by-step. Use markdown formatting."
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt
                },
                {
                    "role": "user",
                    "content": code_snippet,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "AI could not generate an explanation at this time."