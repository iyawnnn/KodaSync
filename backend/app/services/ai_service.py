import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def generate_tags(code_snippet: str, language: str):
    try:
        prompt = f"Analyze the code snippet. The user claims it is {language}. If it is, generate technical tags. If it is NOT {language}, tag the actual language found. Return ONLY a comma-separated list of strings."
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

# FIX: Added the Chat Logic here
def chat_with_notes(context: str, question: str):
    try:
        prompt = f"""
        You are a highly intelligent coding assistant called KodaSync.
        You have access to the user's personal codebase notes.
        
        Here is the relevant context from the user's notes:
        ----------------
        {context}
        ----------------

        Instructions:
        1. Answer the user's question based PRIMARILY on the context provided above.
        2. If the context contains code, reference it explicitly.
        3. If the answer is not in the context, use your general coding knowledge to help.
        4. Be concise and professional. Use Markdown.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": question}],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I'm having trouble connecting to your brain right now."

def fix_code_snippet(code_snippet: str, language: str, error_msg: str = ""):
    """
    Analyzes broken code and returns the FIXED version.
    """
    try:
        prompt = f"""
        You are a Senior Engineer. The user has {language} code that may be broken or unoptimized.
        
        User's Code:
        {code_snippet}
        
        User's Error (Optional): {error_msg}

        Task:
        1. Fix any bugs.
        2. Optimize performance if possible.
        3. Return ONLY the fixed code block. Do not add conversational filler.
        """
        
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error fixing code: {e}")
        return "Could not generate a fix."