create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  account_id uuid not null references accounts(id) on delete cascade,
  login text not null,
  role text not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_sessions_account_idx
on admin_sessions (account_id, created_at desc);

create index if not exists admin_sessions_user_idx
on admin_sessions (user_id, created_at desc);

create index if not exists admin_sessions_active_idx
on admin_sessions (revoked_at, expires_at);

drop trigger if exists set_admin_sessions_updated_at on admin_sessions;
create trigger set_admin_sessions_updated_at
before update on admin_sessions
for each row
execute function set_updated_at();
