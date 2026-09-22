-- Run in the target Supabase SQL editor AFTER deploying the API route.
-- First create these two secrets in Supabase Vault:
-- course_marketing_origin: the HTTPS origin, e.g. https://www.teeahead.com
-- course_marketing_cron_secret: same value as COURSE_WORKER_SECRET (or CRON_SECRET) in that deployment
-- Requires pg_cron and pg_net (Database > Extensions).
do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='course_marketing_origin' and decrypted_secret like 'https://%')
    or not exists(select 1 from vault.decrypted_secrets where name='course_marketing_cron_secret' and length(decrypted_secret)>0) then
    raise exception 'Configure course_marketing_origin and course_marketing_cron_secret in Vault first.';
  end if;
end;
$$;
-- Re-running replaces the named job; it does not create duplicate schedules.
select cron.schedule('course-marketing', '*/5 * * * *', $job$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name='course_marketing_origin'), '/') || '/api/cron/course-marketing',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='course_marketing_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

-- Reconcile course subscription status as a fallback for delayed webhooks.
select cron.schedule('course-billing', '17 * * * *', $job$
 select net.http_post(
   url := rtrim((select decrypted_secret from vault.decrypted_secrets where name='course_marketing_origin'), '/') || '/api/cron/course-billing',
   headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='course_marketing_cron_secret')),
   body := '{}'::jsonb, timeout_milliseconds := 60000
 );
$job$);
