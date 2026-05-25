-- Trigger PostgREST schema cache reload after migration 091 introduced
-- new tables (staff_permissions, role_default_permissions) and a new
-- function (user_has_course_permission). Without this, the API gateway
-- can return "Could not find the table in the schema cache" until its
-- next periodic poll.
NOTIFY pgrst, 'reload schema';
