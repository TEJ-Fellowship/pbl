-- Add token tracking to existing conversation schema
-- This script adds token usage tracking to conversation_sessions and conversation_messages

-- Add token tracking columns to conversation_sessions
ALTER TABLE conversation_sessions 
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 4000,
ADD COLUMN IF NOT EXISTS token_usage_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Add token count to conversation_messages
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0;

-- Create index for token usage queries
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_token_usage 
ON conversation_sessions(token_usage_percentage);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_token_count 
ON conversation_messages(token_count);

-- Function to calculate token count for a text (rough estimation)
CREATE OR REPLACE FUNCTION estimate_token_count(text_content TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Rough estimation: 1 token ≈ 4 characters for English text
    -- This is a simplified estimation - in production, use actual tokenizer
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
    UPDATE conversation_sessions cs
    SET 
        total_tokens = session_total_tokens,
        token_usage_percentage = usage_percentage,
        updated_at = NOW()
    WHERE cs.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get sessions approaching token limit
CREATE OR REPLACE FUNCTION get_sessions_near_token_limit(
    p_threshold DECIMAL(5,2) DEFAULT 80.0
)
RETURNS TABLE (
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    total_tokens INTEGER,
    max_tokens INTEGER,
    token_usage_percentage DECIMAL(5,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.session_id,
        cs.user_id,
        cs.total_tokens,
        cs.max_tokens,
        cs.token_usage_percentage,
        cs.created_at,
        cs.updated_at
    FROM conversation_sessions cs
    WHERE 
        cs.is_active = true 
        AND cs.token_usage_percentage >= p_threshold
    ORDER BY cs.token_usage_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update token count when message is inserted
CREATE OR REPLACE FUNCTION update_message_token_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and set token count for the new message
    NEW.token_count := estimate_token_count(NEW.content);
    
    -- Update session token usage after insert
    PERFORM update_session_token_usage(NEW.session_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic token counting
DROP TRIGGER IF EXISTS trigger_update_message_token_count ON conversation_messages;
CREATE TRIGGER trigger_update_message_token_count
    BEFORE INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_token_count();

-- Update existing messages with token counts (if any exist)
UPDATE conversation_messages 
SET token_count = estimate_token_count(content)
WHERE token_count = 0;

-- Update existing sessions with token usage
DO $$
DECLARE
    session_record RECORD;
BEGIN
    FOR session_record IN 
        SELECT DISTINCT session_id FROM conversation_messages
    LOOP
        PERFORM update_session_token_usage(session_record.session_id);
    END LOOP;
END $$;

-- Comments
COMMENT ON COLUMN conversation_sessions.total_tokens IS 'Total tokens used in this session';
COMMENT ON COLUMN conversation_sessions.max_tokens IS 'Maximum tokens allowed for this session';
COMMENT ON COLUMN conversation_sessions.token_usage_percentage IS 'Percentage of token limit used';
COMMENT ON COLUMN conversation_messages.token_count IS 'Estimated token count for this message';