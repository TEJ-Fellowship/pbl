-- Migration script to support anonymous users
-- This ensures the foreign key constraint allows NULL values for anonymous users

-- First, check if the foreign key constraint exists and drop it if needed
DO $$
BEGIN
    -- Check if constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_sessions_user_id_fkey'
        AND table_name = 'conversation_sessions'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE conversation_sessions 
        DROP CONSTRAINT conversation_sessions_user_id_fkey;
        
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Ensure user_id column allows NULL (it should already, but making sure)
ALTER TABLE conversation_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Recreate the foreign key constraint with proper NULL handling
-- This allows NULL values for anonymous users
ALTER TABLE conversation_sessions
ADD CONSTRAINT conversation_sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Add a comment to document the anonymous user support
COMMENT ON COLUMN conversation_sessions.user_id IS 
'User ID for authenticated users. NULL for anonymous/guest users.';

-- Display success message
SELECT 'Migration completed successfully! Anonymous users are now supported.' as status;

