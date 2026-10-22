create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (char_length(btrim(company)) between 1 and 120),
  role text not null check (char_length(btrim(role)) between 1 and 160),
  stage text not null default 'applied'
    check (stage in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  job_url text check (job_url is null or char_length(job_url) <= 2048),
  applied_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_user_updated_at_idx
  on public.job_applications (user_id, updated_at desc);

create function public.set_job_application_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row
  execute function public.set_job_application_updated_at();

alter table public.job_applications enable row level security;

revoke all on table public.job_applications from anon, authenticated;
grant select, insert, update, delete on table public.job_applications to authenticated;

create policy "Users can view their own applications"
  on public.job_applications
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their own applications"
  on public.job_applications
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own applications"
  on public.job_applications
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own applications"
  on public.job_applications
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
