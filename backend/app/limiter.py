from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_identifier(request: Request):
    # 1. Try to limit by User ID (if logged in)
    # We look for the 'user' object attached by our Auth middleware
    if hasattr(request.state, "user"):
        return str(request.state.user.id)
    
    # 2. Fallback to IP address (for login/signup pages)
    return get_remote_address(request)

limiter = Limiter(key_func=get_identifier)