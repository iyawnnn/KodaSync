import re 
from groq import AsyncGroq
from ..config import settings 

client = AsyncGroq(
    api_key=settings.GROQ_API_KEY,
)

MODEL_SMART = "llama-3.3-70b-versatile" 
MODEL_FAST = "llama-3.1-8b-instant"

# --- DYNAMIC SYSTEM PROMPT ---
def get_adaptive_system_prompt(context_str: str, project_name: str = None):
    project_context = f"You are working on the project: '{project_name}'." if project_name else "You are acting as a General Technical Consultant."

    return f"""
    ### IDENTITY
    You are KodaSync, an Elite Principal Software Architect.
    {project_context}
    
    ### KNOWLEDGE BASE (CONTEXT)
    {context_str}
    
    ### BEHAVIORAL PRINCIPLES
    1. **Adapt to Intent:**
       - **Quick Fix/Snippet:** Provide code immediately. Minimal text.
       - **Concept Explanation:** Use structure, analogies, and clear sections.
       - **Comparison:** STRICTLY use a **Markdown Table** to compare features.
       
    2. **Professional Tone:**
       - High-signal, low-noise. No conversational filler.
       - No emojis. 
       
    3. **Coding Standards:**
       - Production-ready, Clean, DRY.
       - Modern syntax.
       
    4. **Formatting:**
       - Use headers naturally.
       - For lists of 3+ items, use bullet points.
       - For pros/cons or comparisons, use Tables.
    """

async def generate_tags(code_snippet: str, language: str):
    try:
        prompt = "Analyze the code. Return ONLY a comma-separated list of 3-5 technical tags. IMPORTANT: Use correct technical capitalization."
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model=MODEL_FAST,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating tags: {e}")
        return "untagged"
    
async def explain_code_snippet(code_snippet: str, language: str):
    try:
        prompt = "You are a Senior Engineer. Explain this code clearly to a colleague. Be concise."
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model=MODEL_SMART,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "AI could not generate an explanation at this time."

# --- THE MAIN CHAT ENGINE ---
async def stream_chat_with_notes(context: str, question: str, history: list = [], project_name: str = None):
    try:
        system_prompt = get_adaptive_system_prompt(context, project_name)
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": question})
        
        stream = await client.chat.completions.create(
            messages=messages,
            model=MODEL_SMART,
            temperature=0.3, 
            stream=True 
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        yield f"\n[System Error: {str(e)}]"

# --- BACKWARD COMPATIBILITY WRAPPER ---
async def chat_with_notes(context: str, question: str, history: list = [], project_name: str = None):
    response = ""
    async for chunk in stream_chat_with_notes(context, question, history, project_name):
        response += chunk
    return response

async def perform_ai_action(code_snippet: str, language: str, action: str = "fix", error_msg: str = ""):
    language_rules = ""
    if language.lower() in ["javascript", "typescript", "js", "ts"]:
        language_rules = "RULE: In JavaScript/TypeScript, replace 'print()' with 'console.log()' unless explicitly asking for window printing."

    base_instruction = f"Return the code in a Markdown block. The code MUST be valid {language}. {language_rules} If the input is in a different language, TRANSLATE it to {language} first."
    
    prompts = {
        "fix": f"Fix bugs and correct syntax. Context: {error_msg}. {base_instruction}",
        "security": f"Patch vulnerabilities. {base_instruction}",
        "document": f"Add minimal, high-value docstrings/comments. {base_instruction}",
        "optimize": f"Optimize complexity. {base_instruction}",
        "test": f"Write Unit Tests using the standard testing library for {language}. {base_instruction}"
    }

    selected_prompt = prompts.get(action, f"Improve this code. {base_instruction}")
    
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"You are an Elite Developer. Task: {selected_prompt}. Constraint: Code first."},
                {"role": "user", "content": code_snippet}
            ],
            model=MODEL_SMART,
            temperature=0.2, 
        )
        return chat_completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error in AI Action ({action}): {e}")
        return f"// Error: Could not perform {action}."
    
async def generate_chat_title(first_message: str):
    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Generate a concise label (3-5 words max) for this chat. Do not use quotes."},
                {"role": "user", "content": first_message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=20,
        )
        return completion.choices[0].message.content.strip().strip('"')
    except Exception as e:
        return "New Chat"