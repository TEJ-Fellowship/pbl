-- Conversation Memory Schema for Stripe Customer Support Agent
-- This schema supports both short-term (BufferWindowMemory) and long-term (PostgreSQL) memory

-- Conversation sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    total_tokens INTEGER DEFAULT 0,
    max_tokens INTEGER DEFAULT 4000,
    token_usage_percentage DECIMAL(5,2) DEFAULT 0.00
);

-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS conversation_messages (
    message_id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    token_count INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id) ON DELETE CASCADE
);

-- Q&A pairs extracted from conversations for long-term memory
CREATE TABLE IF NOT EXISTS conversation_qa_pairs (
    qa_id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_important BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id) ON DELETE SET NULL
);

-- Conversation summaries for session-level context
CREATE TABLE IF NOT EXISTS conversation_summaries (
    summary_id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    summary_text TEXT NOT NULL,
    key_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id) ON DELETE CASCADE
);

-- Memory retrieval cache for performance
CREATE TABLE IF NOT EXISTS memory_retrieval_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255),
    query_hash VARCHAR(64) NOT NULL,
    retrieved_context JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_active ON conversation_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_updated ON conversation_sessions(updated_at);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_session_id ON conversation_qa_pairs(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_important ON conversation_qa_pairs(is_important);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_relevance ON conversation_qa_pairs(relevance_score);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_tags ON conversation_qa_pairs USING GIN(tags);

-- Full-text search indexes for semantic retrieval
CREATE INDEX IF NOT EXISTS idx_qa_pairs_question_fts ON conversation_qa_pairs USING gin(to_tsvector('english', question));
CREATE INDEX IF NOT EXISTS idx_qa_pairs_answer_fts ON conversation_qa_pairs USING gin(to_tsvector('english', answer));
CREATE INDEX IF NOT EXISTS idx_qa_pairs_context_fts ON conversation_qa_pairs USING gin(to_tsvector('english', context));

CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON conversation_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_summaries_topics ON conversation_summaries USING GIN(key_topics);

CREATE INDEX IF NOT EXISTS idx_memory_cache_expires ON memory_retrieval_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_memory_cache_session ON memory_retrieval_cache(session_id);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_memory_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM memory_retrieval_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent messages for a session (BufferWindowMemory simulation)
CREATE OR REPLACE FUNCTION get_recent_messages(
    p_session_id VARCHAR(255),
    p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
    message_id VARCHAR(255),
    role VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.message_id,
        cm.role,
        cm.content,
        cm.created_at
    FROM conversation_messages cm
    WHERE cm.session_id = p_session_id
    ORDER BY cm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get relevant Q&A pairs for a query
CREATE OR REPLACE FUNCTION get_relevant_qa_pairs(
    p_query TEXT,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    qa_id VARCHAR(255),
    question TEXT,
    answer TEXT,
    context TEXT,
    relevance_score DECIMAL(3,2),
    session_id VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qa.qa_id,
        qa.question,
        qa.answer,
        qa.context,
        qa.relevance_score,
        qa.session_id
    FROM conversation_qa_pairs qa
    WHERE 
        (p_session_id IS NULL OR qa.session_id = p_session_id)
        AND (
            to_tsvector('english', qa.question) @@ plainto_tsquery('english', p_query)
            OR to_tsvector('english', qa.answer) @@ plainto_tsquery('english', p_query)
            OR to_tsvector('english', qa.context) @@ plainto_tsquery('english', p_query)
        )
    ORDER BY 
        qa.relevance_score DESC,
        ts_rank(to_tsvector('english', qa.question), plainto_tsquery('english', p_query)) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to estimate token count for text
CREATE OR REPLACE FUNCTION estimate_token_count(text_content TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Rough estimation: 1 token ≈ 4 characters for English text
    RETURN GREATEST(1, CEIL(LENGTH(text_content) / 4.0));
END;
$$ LANGUAGE plpgsql;

-- Function to update session token usage
CREATE OR REPLACE FUNCTION update_session_token_usage(p_session_id VARCHAR(255))
RETURNS VOID AS $$
DECLARE
    session_total_tokens INTEGER;
    session_max_tokens INTEGER;
    usage_percentage DECIMAL(5,2);
BEGIN
    -- Get total tokens for the session
    SELECT COALESCE(SUM(token_count), 0) INTO session_total_tokens
    FROM conversation_messages 
    WHERE session_id = p_session_id;
    
    -- Get max tokens for the session
    SELECT COALESCE(cs.max_tokens, 4000) INTO session_max_tokens
    FROM conversation_sessions cs
    WHERE cs.session_id = p_session_id;
    
    -- Calculate usage percentage
    usage_percentage := (session_total_tokens::DECIMAL / session_max_tokens::DECIMAL) * 100;
    
    -- Update session with new token counts
    UPDATE conversation_sessions 
    SET 
        total_tokens = session_total_tokens,
        token_usage_percentage = usage_percentage,
        updated_at = NOW()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO conversation_sessions (session_id, user_id, metadata) VALUES 
('test_session_1', 'user_123', '{"project": "stripe_integration", "context": "payment_processing"}')
ON CONFLICT (session_id) DO NOTHING;

-- Comments
COMMENT ON TABLE conversation_sessions IS 'Stores conversation sessions with metadata';
COMMENT ON TABLE conversation_messages IS 'Individual messages within conversations';
COMMENT ON TABLE conversation_qa_pairs IS 'Extracted Q&A pairs for long-term memory retrieval';
COMMENT ON TABLE conversation_summaries IS 'Session-level summaries for context';
COMMENT ON TABLE memory_retrieval_cache IS 'Cache for memory retrieval results to improve performance';
