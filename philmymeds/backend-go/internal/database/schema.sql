-- Validation jobs table
CREATE TABLE IF NOT EXISTS validation_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    prescription_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    locked_at TIMESTAMP,
    locked_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Index for efficient job polling
CREATE INDEX IF NOT EXISTS idx_validation_jobs_status ON validation_jobs (status, created_at);



