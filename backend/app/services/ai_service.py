import os
import re 
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

MODEL_SMART = "llama-3.3-70b-versatile" 
MODEL_FAST = "llama-3.1-8b-instant"

# --- 🧠 DYNAMIC SYSTEM PROMPT ---
def get_adaptive_system_prompt(context_str: str, project_name: str = None):
    # If a project is selected, we inject it into the identity
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

def generate_tags(code_snippet: str, language: str):
    try:
        prompt = "Analyze the code. Return ONLY a comma-separated list of 3-5 technical tags."
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model=MODEL_FAST,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating tags: {e}")
        return "untagged"
    
def explain_code_snippet(code_snippet: str, language: str):
    try:
        prompt = "You are a Senior Engineer. Explain this code clearly to a colleague. Be concise."
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": code_snippet}],
            model=MODEL_SMART,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating explanation: {e}")
        return "AI could not generate an explanation at this time."

# --- 🚀 THE MAIN CHAT ENGINE ---
def stream_chat_with_notes(context: str, question: str, history: list = [], project_name: str = None):
    """
    Generator function using the Adaptive System Prompt.
    """
    try:
        # Pass project_name to the prompt generator
        system_prompt = get_adaptive_system_prompt(context, project_name)

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": question})
        
        stream = client.chat.completions.create(
            messages=messages,
            model=MODEL_SMART,
            temperature=0.3, 
            stream=True 
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        yield f"\n[System Error: {str(e)}]"

# --- 👇 THE MISSING FUNCTION THAT CAUSED THE ERROR 👇 ---
def chat_with_notes(context: str, question: str, history: list = [], project_name: str = None):
    """
    Non-streaming wrapper for backward compatibility.
    """
    return "".join(stream_chat_with_notes(context, question, history, project_name))

def perform_ai_action(code_snippet: str, language: str, action: str = "fix", error_msg: str = ""):
    """
    Executes specific engineering tasks.
    """
    base_instruction = "Return the code in a Markdown block. Follow with a 1-sentence technical summary."
    
    prompts = {
        "fix": f"Fix bugs. Context: {error_msg}. {base_instruction}",
        "secure": f"Patch vulnerabilities. {base_instruction}",
        "document": f"Add minimal, high-value docstrings. {base_instruction}",
        "optimize": f"Optimize complexity. {base_instruction}",
        "test": f"Write Unit Tests. {base_instruction}"
    }

    system_prompt = f"""
    You are an Elite Developer.
    Task: {prompts.get(action, "Improve code")}
    Constraint: No conversational filler. Code first.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": code_snippet}
            ],
            model=MODEL_SMART,
            temperature=0.2, 
        )
        return chat_completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error in AI Action ({action}): {e}")
        return f"// Error: Could not perform {action}."