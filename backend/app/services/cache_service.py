import redis
import json
import os

# 1. Connect to the Redis Container
# The hostname 'redis' comes from docker-compose.yml service name
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

def get_cache(key: str):
    """Retrieve data from Redis"""
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    return None

def set_cache(key: str, data: list, expire: int = 300):
    """Save data to Redis (Default expiry: 5 minutes)"""
    # We must convert Python objects to JSON strings to store them
    serialized_data = json.dumps([item.model_dump(mode='json') for item in data])
    redis_client.setex(key, expire, serialized_data)
    
def clear_user_search_cache(user_id):
    """
    Deletes all search cache entries for a specific user.
    Useful when the user adds or deletes a note.
    """
    # Pattern: search:{user_id}:*
    pattern = f"search:{user_id}:*"
    
    # Find all keys matching the pattern
    keys = list(redis_client.scan_iter(match=pattern))
    
    if keys:
        redis_client.delete(*keys)
        print(f"🧹 Cleared {len(keys)} cache keys for user {user_id}")