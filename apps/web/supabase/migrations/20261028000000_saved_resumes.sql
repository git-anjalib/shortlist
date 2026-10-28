create table public.saved_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  resume_text text not null check (char_length(btrim(resume_text)) between 1 and 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_resumes_user_updated_at_idx
  on public.saved_resumes (user_id, updated_at desc);

create function public.set_saved_resume_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger saved_resumes_set_updated_at
  before update on public.saved_resumes
  for each row
  execute function public.set_saved_resume_updated_at();

alter table public.saved_resumes enable row level security;

revoke all on table public.saved_resumes from anon, authenticated;
grant select, insert, update, delete on table public.saved_resumes to authenticated;

create policy "Users can view their own saved resumes"
  on public.saved_resumes
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can save their own resumes"
  on public.saved_resumes
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own saved resumes"
  on public.saved_resumes
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own saved resumes"
  on public.saved_resumes
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
