-- Ensure at most one active membership record per user
alter table public.memberships
  add constraint memberships_user_id_unique unique (user_id);
