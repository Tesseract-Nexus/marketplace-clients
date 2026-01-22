-- Add tenant testimonial submission fields
-- This migration adds support for tenants to submit their own testimonials
-- with approval workflow before publishing

-- Add tenant_id to link testimonials to tenants
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;

-- Add status field for approval workflow (pending, approved, rejected, revision_needed)
-- Default to 'approved' to maintain backward compatibility with existing testimonials
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'approved';

-- Add submission timestamp
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

-- Add review timestamp
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

-- Add reviewer identifier
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "reviewed_by" varchar(100);

-- Add revision notes for feedback to tenants
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "revision_notes" text;

-- Create index on tenant_id for fast lookup of tenant's testimonial
CREATE INDEX IF NOT EXISTS "testimonials_tenant_id_idx" ON "testimonials" USING btree ("tenant_id");

-- Create index on status for filtering by approval status
CREATE INDEX IF NOT EXISTS "testimonials_status_idx" ON "testimonials" USING btree ("status");
