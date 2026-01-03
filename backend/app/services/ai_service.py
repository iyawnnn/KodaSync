import os
import re # <--- Required for cleaning output
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def generate_tags(code_snippet: str, language: str):
    try:
        # FIX: Added "Limit to maximum 5 specific tags" constraint
        prompt = f"Analyze the code snippet. The user claims it is {language}. If it is, generate technical tags. If it is NOT {language}, tag the actual language found. Return ONLY a comma-separated list of strings. Limit to maximum 5 most relevant tags."
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating tags: {e}")
        return "untagged"
    
def explain_code_snippet(code_snippet: str, language: str):
    try:
        prompt = f"You are a Senior Developer. Explain this {language} code to a junior developer. Be concise. Break it down step-by-step. Use markdown formatting."
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "AI could not generate an explanation at this time."

def chat_with_notes(context: str, question: str, history: list = []):
    """
    Context-Aware Chat with History support
    """
    try:
        system_prompt = f"""
        You are KodaSync, an intelligent coding assistant.
        
        Context from User's Knowledge Base:
        ----------------
        {context}
        ----------------
        
        Instructions:
        1. Use the Context above to answer.
        2. If the context is empty, use your general knowledge.
        3. Be concise and helpful.
        """

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history) # Append conversation history
        messages.append({"role": "user", "content": question})
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I'm having trouble connecting to your brain right now."

# FIX: Replaced 'fix_code_snippet' with the smarter 'perform_ai_action'
def perform_ai_action(code_snippet: str, language: str, action: str = "fix", error_msg: str = ""):
    """
    Executes a specific AI engineering task and cleans the output.
    Actions: 'fix', 'secure', 'document', 'optimize', 'test'
    """
    
    # 1. Define Persona Prompts
    prompts = {
        "fix": f"You are a Senior Debugger. Fix bugs in this {language} code. Return ONLY the code. Context: {error_msg}",
        "secure": f"You are a Security Expert. Patch vulnerabilities (SQLi, XSS, etc) in this {language} code. Return ONLY the code.",
        "document": f"You are a Tech Writer. Add docstrings/comments to this {language} code. Return ONLY the code.",
        "optimize": f"You are a Performance Engineer. Optimize this {language} code. Return ONLY the code.",
        "test": f"You are a QA Engineer. Write Unit Tests for this {language} code. Return ONLY the code."
    }

    system_prompt = prompts.get(action, prompts["fix"])

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": code_snippet}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2, # Low temperature for code precision
        )
        
        raw_content = chat_completion.choices[0].message.content
        
        # --- CLEANING LOGIC ---
        # Removes ```python and ``` backticks so the output is pure code
        clean_content = re.sub(r"```[a-zA-Z]*\n", "", raw_content) 
        clean_content = re.sub(r"```", "", clean_content)          
        
        return clean_content.strip()

    except Exception as e:
        print(f"Error in AI Action ({action}): {e}")
        return f"// Error: Could not perform {action}."