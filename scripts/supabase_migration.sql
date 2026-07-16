-- Migration: Add service_type to inquiries for Import Only feature

-- 1. Add service_type column to inquiries table
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'BUY_AND_IMPORT';

-- 2. Add an explanation comment to the column
COMMENT ON COLUMN inquiries.service_type IS 'BUY_AND_IMPORT or IMPORT_ONLY';
