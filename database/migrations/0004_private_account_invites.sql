create table if not exists account_owner_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_account_id uuid references accounts(id) on delete set null,
  inviter_user_id text,
  company_name text not null,
  owner_name text not null,
  login text not null,
  invite_token_hash text not null,
  status text not null default 'pending',
  created_account_id uuid references accounts(id) on delete set null,
  created_user_id text,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_owner_invites_token_unique_idx
on account_owner_invites (invite_token_hash);

create index if not exists account_owner_invites_login_idx
on account_owner_invites (lower(login));

create index if not exists account_owner_invites_status_invited_idx
on account_owner_invites (status, invited_at desc);

drop trigger if exists set_account_owner_invites_updated_at on account_owner_invites;
create trigger set_account_owner_invites_updated_at
before update on account_owner_invites
for each row
execute function set_updated_at();
