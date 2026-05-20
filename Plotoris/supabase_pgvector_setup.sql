-- ============================================================
-- PLOTORIS Phase 2 — Supabase pgvector Setup
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create a table to store parsed paper chunks and their embeddings
CREATE TABLE IF NOT EXISTS public."Documents" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536) -- OpenAI embedding dimensionality
);

-- 3. Create an index for fast semantic similarity search (using inner product)
-- HNSW (Hierarchical Navigable Small World) is recommended for best performance on pgvector
CREATE INDEX IF NOT EXISTS idx_documents_embedding 
ON public."Documents" 
USING hnsw (embedding vector_cosine_ops);

-- 4. Create a function to perform similarity search 
-- This will be called by SupabaseVectorStore from LangChain
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'
) RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public."Documents" d
  WHERE d.metadata @> filter
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Allow anonymous read/write if necessary for your Next.js API routes
-- (Since Next.js API routes run on the server, you could also use the service_role key to bypass RLS,
-- but if using anon key, you need RLS policies.)
ALTER TABLE public."Documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_docs" ON public."Documents" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_docs" ON public."Documents" FOR INSERT TO anon WITH CHECK (true);
