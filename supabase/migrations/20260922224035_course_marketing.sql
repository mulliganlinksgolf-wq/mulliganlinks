-- Access goes through authenticated server actions; no client gets audience addresses.
create table public.course_email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null check (email = lower(trim(email))),
  subscribed boolean not null default false,
  consent_at timestamptz,
  updated_at timestamptz not null default now(),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  unique(course_id, user_id),
  unique(course_id, email)
);
create table public.course_email_campaigns (
  id uuid primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  subject text not null check (length(subject) between 1 and 150),
  body text not null check (length(body) between 1 and 10000),
  audience text not null check (audience in ('all','fairway','eagle','ace','eagle_ace')),
  sender_name text not null,
  postal_address text not null,
  status text not null default 'queued' check (status in ('queued','complete','cancelled')),
  created_at timestamptz not null default now()
);
create table public.course_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.course_email_campaigns(id) on delete cascade,
  subscription_id uuid not null references public.course_email_subscriptions(id) on delete cascade,
  email text not null,
  unsubscribe_token uuid not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  provider_id text,
  error text,
  unique(campaign_id, email)
);
create index course_email_pending on public.course_email_deliveries(campaign_id) where status = 'pending';
create index course_email_history on public.course_email_campaigns(course_id, created_at desc);
create table public.course_email_worker (
  id boolean primary key default true check (id),
  locked_until timestamptz not null default '-infinity'
);
insert into public.course_email_worker(id) values(true);

alter table public.course_email_subscriptions enable row level security;
alter table public.course_email_campaigns enable row level security;
alter table public.course_email_deliveries enable row level security;
alter table public.course_email_worker enable row level security;
revoke all on public.course_email_subscriptions, public.course_email_campaigns, public.course_email_deliveries, public.course_email_worker from public, anon, authenticated;
grant all on public.course_email_subscriptions, public.course_email_campaigns, public.course_email_deliveries, public.course_email_worker to service_role;

create view public.course_email_audience with (security_invoker = true) as
select s.*, case when m.tier in ('eagle','ace') then m.tier else 'fairway' end as tier
from public.course_email_subscriptions s
left join lateral (
  select tier from public.memberships where user_id = s.user_id and status = 'active'
  order by case tier when 'ace' then 1 when 'eagle' then 2 else 3 end limit 1
) m on true
where s.subscribed;
revoke all on public.course_email_audience from public, anon, authenticated;
grant select on public.course_email_audience to service_role;

create function public.course_email_counts(p_course uuid)
returns table(tier text, count bigint) language sql security invoker set search_path = public as $$
  select tier, count(*) from course_email_audience where course_id = p_course group by tier;
$$;

-- One transaction snapshots recipients and content. Replayed submissions cannot enqueue twice.
create function public.queue_course_email(p_id uuid, p_course uuid, p_actor uuid, p_subject text, p_body text, p_audience text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare c public.courses; n integer;
begin
  select * into strict c from courses where id = p_course and status = 'active' for update;
  if exists(select 1 from course_email_campaigns where id = p_id and course_id = p_course and created_by = p_actor) then return p_id; end if;
  if coalesce(trim(c.address),'') = '' or coalesce(trim(c.city),'') = '' or coalesce(trim(c.state),'') = '' or coalesce(trim(c.zip),'') = '' then
    raise exception 'Add the course mailing address before sending.';
  end if;
  if (select count(*) from course_email_campaigns where course_id = p_course and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'You can send up to five campaigns per day.';
  end if;
  insert into course_email_campaigns(id, course_id, created_by, subject, body, audience, sender_name, postal_address)
  values(p_id,p_course,p_actor,p_subject,p_body,p_audience,c.name,concat_ws(', ',c.address,c.city,c.state,c.zip));
  insert into course_email_deliveries(campaign_id,subscription_id,email,unsubscribe_token)
  select p_id,id,email,unsubscribe_token from course_email_audience
  where course_id = p_course and (p_audience = 'all' or tier = p_audience or (p_audience = 'eagle_ace' and tier in ('eagle','ace')));
  get diagnostics n = row_count;
  if n = 0 then raise exception 'No subscribed golfers in this audience yet.'; end if;
  return p_id;
end;
$$;

create function public.course_email_history(p_course uuid)
returns table(id uuid, subject text, audience text, status text, created_at timestamptz, total bigint, sent bigint, failed bigint, skipped bigint, pending bigint)
language sql security invoker set search_path = public as $$
select c.id,c.subject,c.audience,c.status,c.created_at,count(d.id),
 count(d.id) filter(where d.status='sent'), count(d.id) filter(where d.status='failed'),
 count(d.id) filter(where d.status='skipped'), count(d.id) filter(where d.status='pending')
from course_email_campaigns c left join course_email_deliveries d on d.campaign_id=c.id
where c.course_id=p_course group by c.id order by c.created_at desc limit 25;
$$;

create function public.claim_course_email_worker()
returns boolean language sql security invoker set search_path = public as $$
with claimed as (
 update course_email_worker set locked_until=now()+interval '2 minutes'
 where id and locked_until < now() returning id
) select exists(select 1 from claimed);
$$;

revoke all on function public.course_email_counts(uuid), public.queue_course_email(uuid,uuid,uuid,text,text,text), public.course_email_history(uuid), public.claim_course_email_worker() from public, anon, authenticated;
grant execute on function public.course_email_counts(uuid), public.queue_course_email(uuid,uuid,uuid,text,text,text), public.course_email_history(uuid), public.claim_course_email_worker() to service_role;
