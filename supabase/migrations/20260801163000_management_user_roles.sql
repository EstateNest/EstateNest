begin;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin', 'manager', 'advisor', 'marketing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

revoke all on table public.user_roles from anon;
revoke all on table public.user_roles from authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.user_roles (user_id, role)
select id, 'super_admin'
from auth.users
where id = '4dc58762-15a1-4fd5-a253-fabc3b8269cf'::uuid
on conflict (user_id) do update
set role = excluded.role,
    updated_at = now();

commit;
