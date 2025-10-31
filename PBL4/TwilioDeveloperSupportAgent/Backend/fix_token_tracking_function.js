import pool from "./config/database.js";

/**
 * Fix the ambiguous max_tokens reference in update_session_token_usage function
 */
async function fixTokenTrackingFunction() {
  console.log("🔧 Fixing update_session_token_usage function...");

  const fixedFunctionSQL = `
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
        
        -- Get max tokens for the session (FIXED: use table alias to avoid ambiguity)
        SELECT COALESCE(cs.max_tokens, 4000) INTO session_max_tokens
        FROM conversation_sessions cs
        WHERE cs.session_id = p_session_id;
        
        -- Calculate usage percentage
        usage_percentage := (session_total_tokens::DECIMAL / session_max_tokens::DECIMAL) * 100;
        
        -- Update session with new token counts (use different variable names to avoid ambiguity)
        UPDATE conversation_sessions cs
        SET 
            total_tokens = session_total_tokens,
            token_usage_percentage = usage_percentage,
            updated_at = NOW()
        WHERE cs.session_id = p_session_id;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    await pool.query(fixedFunctionSQL);
    console.log("✅ Function updated successfully!");
  } catch (error) {
    console.error("❌ Failed to update function:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("fix_token_tracking_function.js")) {
  fixTokenTrackingFunction().catch(console.error);
}

export default fixTokenTrackingFunction;

