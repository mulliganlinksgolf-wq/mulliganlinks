-- Add unique constraint on course_pricing(course_id, rate_name) so that
-- the settings page upsert (ON CONFLICT course_id,rate_name) works correctly.
-- Deduplicate any existing rows keeping the one with the lowest display_order
-- before adding the constraint.

DELETE FROM public.course_pricing cp1
USING public.course_pricing cp2
WHERE cp1.course_id = cp2.course_id
  AND cp1.rate_name  = cp2.rate_name
  AND cp1.display_order > cp2.display_order;

ALTER TABLE public.course_pricing
  ADD CONSTRAINT course_pricing_course_id_rate_name_key
  UNIQUE (course_id, rate_name);
