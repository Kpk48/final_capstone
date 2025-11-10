-- Semantic Search Function for RAG Tools
-- Run this in your Supabase SQL Editor after enabling pgvector

-- Create a function to match embeddings using cosine similarity
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  owner_type text,
  owner_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.owner_type,
    embeddings.owner_id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.metadata
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_embeddings TO service_role;

SELECT 'Semantic search function created successfully!' as status;
