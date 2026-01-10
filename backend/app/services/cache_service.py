import redis
import json
from ..config import settings

# Connect using the Environment Variable (Works in Docker AND Render)
# This automatically handles user, password, host, and port from the URL.
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_cache(key: str):
    """Retrieve data from Redis"""
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Redis Error (Get): {e}")
    return None

def set_cache(key: str, data: list, expire: int = 300):
    """Save data to Redis (Default expiry: 5 minutes)"""
    try:
        # We must convert Python objects to JSON strings to store them
        serialized_data = json.dumps([item.model_dump(mode='json') for item in data])
        redis_client.setex(key, expire, serialized_data)
    except Exception as e:
        print(f"Redis Error (Set): {e}")
    
def clear_user_search_cache(user_id):
    """
    Deletes all search cache entries for a specific user.
    """
    try:
        # Pattern: search:{user_id}:*
        pattern = f"search:{user_id}:*"
        
        # Find all keys matching the pattern
        keys = list(redis_client.scan_iter(match=pattern))
        
        if keys:
            redis_client.delete(*keys)
            print(f"Cleared {len(keys)} cache keys for user {user_id}")
    except Exception as e:
        print(f"Redis Error (Clear): {e}")

def set_simple_cache(key: str, data: dict, expire: int = 3600):
    """
    Save simple dictionary/text data to Redis (Default: 1 hour)
    """
    try:
        redis_client.setex(key, expire, json.dumps(data))
    except Exception as e:
        print(f"Redis Error (Set Simple): {e}")