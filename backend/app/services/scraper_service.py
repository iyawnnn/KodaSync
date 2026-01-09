import requests
from bs4 import BeautifulSoup
import re

def scrape_url(url: str):
    try:
        # SMART GITHUB HANDLING
        # If user pastes a GitHub file UI link, convert to RAW link
        # Ex: github.com/user/repo/blob/main/file.py -> raw.githubusercontent.com/user/repo/main/file.py
        if "github.com" in url and "/blob/" in url:
            url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
        
        # Fake a browser so websites don't block us
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # If it's a raw code file (GitHub), just return the text
        if "raw.githubusercontent.com" in url:
            return {
                "title": url.split("/")[-1], # Filename as title
                "content": response.text[:15000], # Limit char count
                "language": detect_language(url)
            }

        # Otherwise, parse HTML (Documentation sites)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Kill noise
        for script in soup(["script", "style", "nav", "footer", "iframe", "svg"]):
            script.extract()    

        text = soup.get_text(separator="\n")
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        text = '\n'.join(chunk for chunk in lines if chunk)
        
        return {
            "title": soup.title.string.strip() if soup.title else url,
            "content": text[:10000],
            "language": "text"
        }
    except Exception as e:
        print(f"Scrape Error: {e}")
        return None

def detect_language(url: str):
    # Using a mapping is more efficient and easier to update.
    extension_map = {
        ".py": "python",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".rs": "rust",
        ".go": "go",
        ".md": "markdown"
    }
    
    for ext, lang in extension_map.items():
        if url.endswith(ext):
            return lang
    return "text"