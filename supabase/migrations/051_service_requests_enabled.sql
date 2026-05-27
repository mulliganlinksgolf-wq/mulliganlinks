-- Add service_requests_enabled flag to courses
-- Defaults to true so existing courses keep working

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS service_requests_enabled BOOLEAN NOT NULL DEFAULT true;
