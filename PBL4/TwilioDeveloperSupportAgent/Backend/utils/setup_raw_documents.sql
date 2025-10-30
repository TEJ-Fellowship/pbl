-- Create raw documents table for storing scraped documents
CREATE TABLE raw_documents (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT NOT NULL,
    category VARCHAR(100),
    title TEXT,
    content TEXT NOT NULL,
    word_count INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW(),
    doc_type VARCHAR(50),
    metadata JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_raw_documents_category ON raw_documents (category);
CREATE INDEX idx_raw_documents_processed ON raw_documents (processed);
CREATE INDEX idx_raw_documents_scraped_at ON raw_documents (scraped_at);
CREATE INDEX idx_raw_documents_doc_type ON raw_documents (doc_type);

-- Create full-text search index for content
CREATE INDEX idx_raw_documents_content_gin ON raw_documents USING gin(to_tsvector('english', content));

-- Create metadata search index
CREATE INDEX idx_raw_documents_metadata_gin ON raw_documents USING gin(metadata);

-- Create composite index for processing queries
CREATE INDEX idx_raw_documents_processed_category ON raw_documents (processed, category);

-- Display success message
SELECT 'Raw documents table setup completed successfully!' as status;

-- Command to run the script
-- psql -U postgres -d stripe_support_db -f setup_raw_documents.sql