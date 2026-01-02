from slowapi import Limiter
from slowapi.util import get_remote_address

# This creates the "Bouncer" that checks IP addresses
limiter = Limiter(key_func=get_remote_address)