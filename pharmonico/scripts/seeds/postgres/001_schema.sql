-- Pharmonico PostgreSQL Schema
-- Job Queue and Audit Logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table for background processing
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for job polling (pending jobs ordered by scheduled time)
CREATE INDEX idx_jobs_pending ON jobs (scheduled_at) 
    WHERE status = 'pending';

-- Index for job type filtering
CREATE INDEX idx_jobs_type ON jobs (type);

-- Index for job status
CREATE INDEX idx_jobs_status ON jobs (status);

-- Audit logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    payload JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for entity lookups
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- Index for actor lookups
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor);

-- Index for time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

-- Index for status change queries
CREATE INDEX idx_audit_logs_status ON audit_logs (previous_status, new_status) 
    WHERE previous_status IS NOT NULL OR new_status IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for jobs updated_at
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Job status enum comment for documentation
COMMENT ON COLUMN jobs.status IS 'pending, processing, succeeded, failed';

-- Job type enum comment for documentation
COMMENT ON COLUMN jobs.type IS 'validate_prescription, check_enrollment, pharmacy_recommendation, run_adjudication, create_payment_link, start_shipping, check_delivery';

