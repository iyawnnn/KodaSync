from fastembed import TextEmbedding

# Initialize the model once. It downloads automatically the first time.
# 'BAAI/bge-small-en-v1.5' is optimized for retrieval and is very fast.
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def get_vector(text: str) -> list[float]:
    """
    Converts text (like code or titles) into a list of 384 numbers (vector).
    """
    try:
        # FastEmbed is a generator, so we convert to list
        vectors = list(embedding_model.embed([text]))
        return vectors[0].tolist() # Return the first (and only) vector
    except Exception as e:
        print(f"Error generating vector: {e}")
        return []