-- Create document chunks table for BM25 search
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    title VARCHAR(500),
    category VARCHAR(100),
    source VARCHAR(500),
    word_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient BM25 search
CREATE INDEX idx_document_chunks_content_gin ON document_chunks USING gin(to_tsvector('english', content));
CREATE INDEX idx_document_chunks_metadata_gin ON document_chunks USING gin(metadata);
CREATE INDEX idx_document_chunks_category ON document_chunks (category);
CREATE INDEX idx_document_chunks_source ON document_chunks (source);
CREATE INDEX idx_document_chunks_word_count ON document_chunks (word_count);

-- Create composite index for hybrid queries
CREATE INDEX idx_document_chunks_category_word_count ON document_chunks (category, word_count);

-- Create index for chunk_id lookups
CREATE INDEX idx_document_chunks_chunk_id ON document_chunks (chunk_id);

-- Display success message
SELECT 'Database setup completed successfully!' as status;


-- command to run the script
-- psql -U stripe_user -d stripe_support_db -f setup_database.sql  

-- //if it didnot work then use this command ( super user)
-- psql -U postgres -d stripe_support_db -f setup_database.sql