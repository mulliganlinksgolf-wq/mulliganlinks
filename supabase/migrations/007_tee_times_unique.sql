alter table public.tee_times
  add constraint tee_times_course_scheduled_unique unique (course_id, scheduled_at);
