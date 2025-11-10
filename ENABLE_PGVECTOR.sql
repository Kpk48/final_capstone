-- Enable pgvector extension for embeddings support
-- Run this in your Supabase SQL Editor

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop the existing embeddings table if it exists (to recreate with proper vector type)
DROP TABLE IF EXISTS public.embeddings;

-- 3. Recreate embeddings table with proper vector type
CREATE TABLE public.embeddings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  owner_type text NOT NULL CHECK (owner_type = ANY (ARRAY['student_resume'::text, 'internship'::text])),
  owner_id uuid NOT NULL,
  content text NOT NULL,
  embedding vector(768) NOT NULL,  -- 768 dimensions for Gemini text-embedding-004
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT embeddings_pkey PRIMARY KEY (id)
);

-- 4. Create index for faster similarity search
CREATE INDEX ON public.embeddings USING ivfflat (embedding vector_cosine_ops);

-- 5. Grant permissions (adjust if needed)
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Optional: Create RLS policies for embeddings
-- CREATE POLICY "Allow authenticated users to read embeddings" 
--   ON public.embeddings FOR SELECT 
--   USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to insert embeddings" 
--   ON public.embeddings FOR INSERT 
--   WITH CHECK (auth.role() = 'authenticated');

SELECT 'pgvector extension enabled and embeddings table created!' as status;
