alter table public.job_applications
  add column deleted_at timestamptz;

alter table public.saved_resumes
  add column deleted_at timestamptz;

create index job_applications_active_user_updated_at_idx
  on public.job_applications (user_id, updated_at desc)
  where deleted_at is null;

create index saved_resumes_active_user_updated_at_idx
  on public.saved_resumes (user_id, updated_at desc)
  where deleted_at is null;

drop policy if exists "Users can delete their own applications"
  on public.job_applications;

drop policy if exists "Users can delete their own saved resumes"
  on public.saved_resumes;

revoke delete on table public.job_applications, public.saved_resumes
  from anon, authenticated;