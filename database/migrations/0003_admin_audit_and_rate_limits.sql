create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete set null,
  actor_user_id text,
  actor_login text,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_account_created_idx
on admin_audit_logs (account_id, created_at desc);

create index if not exists admin_audit_logs_action_created_idx
on admin_audit_logs (action, created_at desc);

create table if not exists auth_rate_limits (
  action text not null,
  subject text not null,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (action, subject)
);

create index if not exists auth_rate_limits_blocked_until_idx
on auth_rate_limits (blocked_until);
