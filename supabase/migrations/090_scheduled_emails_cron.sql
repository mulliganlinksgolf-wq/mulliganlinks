-- Enable pg_cron + pg_net for scheduling and HTTP calls from the database.
-- The actual cron job + vault secret are set up via a separate one-off SQL
-- script (not in version control) so the CRON_SECRET stays out of git.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
