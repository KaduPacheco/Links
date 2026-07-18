import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createAccountSlug, DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { getPool, requirePool } from "@/lib/db";
import { createDemoLinksForAccount } from "@/lib/links";
import { logger } from "@/lib/logger";
import { updateSiteSettings } from "@/lib/site-settings";
import type { AdminInviteResult, AdminRole, AdminUser } from "@/types/admin-user";
import type { AccountOwnerInvite, AccountOwnerInviteResult } from "@/types/account-invite";
import { defaultSiteSettings } from "@/types/site-settings";
import type { Account } from "@/types/account";

type StoredAdminUser = {
  id: string | number;
  account_id: string | null;
  name: string | null;
  login: string;
  password_hash: string;
  role: AdminRole | null;
  status: "pending" | "active" | "inactive" | null;
  created_at: string;
  updated_at: string;
  invited_at: string | null;
  accepted_at: string | null;
};

type StoredAccountOwnerInvite = {
  id: string;
  inviter_account_id: string | null;
  inviter_user_id: string | null;
  company_name: string;
  owner_name: string;
  login: string;
  status: "pending" | "accepted" | "revoked";
  created_account_id: string | null;
  created_user_id: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminAccountInfo = {
  login: string | null;
  credentialSource: "database" | "environment" | null;
};

type ResolvedCredentials = {
  id: string;
  accountId: string;
  name: string;
  login: string;
  role: AdminRole;
  passwordHash: string | null;
  plainPassword: string | null;
  source: "database" | "environment";
};

type CreateAccountInput = {
  companyName: string;
  ownerName: string;
  login: string;
  password: string;
};

const reservedAccountSlugs = new Set(["admin", "api", "blog", "materiais", "cadastro", "default"]);

function getEnvAdminLogin() {
  return process.env.ADMIN_EMAIL?.trim() || process.env.ADMIN_USERNAME?.trim() || null;
}

function getEnvAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function verifyHashedPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

function mapAdminUser(row: StoredAdminUser): AdminUser {
  return {
    id: String(row.id),
    account_id: row.account_id ?? DEFAULT_ACCOUNT_ID,
    name: row.name ?? row.login,
    login: row.login,
    role: row.role ?? "owner",
    status: row.status ?? "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at
  };
}

function buildInviteUrl(token: string, requestOrigin?: string) {
  const baseUrl =
    requestOrigin?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return `${normalizedBase.replace(/\/$/, "")}/admin/convite/${token}`;
}

function buildAccountInviteUrl(token: string, requestOrigin?: string) {
  const baseUrl =
    requestOrigin?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return `${normalizedBase.replace(/\/$/, "")}/cadastro/convite/${token}`;
}

function isReservedAccountSlug(slug: string) {
  return reservedAccountSlugs.has(slug);
}

function readBooleanEnv(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function isPublicAccountSignupEnabled() {
  return readBooleanEnv("ALLOW_PUBLIC_SIGNUP");
}

export function getPublicAccountSignupDisabledMessage() {
  return "Novas contas são liberadas somente por convite privado enviado pelo responsável da operação.";
}

function mapAccountOwnerInvite(row: StoredAccountOwnerInvite): AccountOwnerInvite {
  return {
    id: row.id,
    inviter_account_id: row.inviter_account_id,
    inviter_user_id: row.inviter_user_id,
    company_name: row.company_name,
    owner_name: row.owner_name,
    login: row.login,
    status: row.status,
    created_account_id: row.created_account_id,
    created_user_id: row.created_user_id,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function ensureUniqueAccountSlug(pool: ReturnType<typeof requirePool>, companyName: string) {
  const baseSlug = createAccountSlug(companyName);
  let slug = isReservedAccountSlug(baseSlug) ? `${baseSlug}-links` : baseSlug;

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const { rows } = await pool.query<{ id: string }>("select id::text from accounts where slug = $1 limit 1", [slug]);

    if (!rows[0] && !isReservedAccountSlug(slug)) {
      return slug;
    }

    slug = `${baseSlug}-${attempt + 1}`;
  }

  throw new Error("Não foi possível gerar um slug único para a conta.");
}

async function initializeProvisionedAccount(account: Account) {
  try {
    await updateSiteSettings(
      {
        ...defaultSiteSettings,
        company_name: account.name,
        brand_label: "Mais controle. Menos retrabalho.",
        company_logo_url: null,
        hero_badge: "Mais controle. Menos retrabalho.",
        hero_description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
        links_heading: "Canais oficiais",
        links_description: "Conheça as soluções, conteúdos e canais oficiais da Jornada."
      },
      account.id
    );
  } catch (error) {
    logger.error("PostgreSQL signup settings creation failed", error, { accountId: account.id });
  }

  try {
    await createDemoLinksForAccount(account.id);
  } catch (error) {
    logger.error("PostgreSQL signup demo links creation failed", error, { accountId: account.id });
  }
}

async function provisionAccountWithOwner(
  pool: ReturnType<typeof requirePool>,
  input: CreateAccountInput
): Promise<{ account: Account; user: AdminUser }> {
  const existingLogin = await pool.query<{ id: string }>(
    `
      select id::text
      from admin_users
      where lower(login) = lower($1)
      limit 1
    `,
    [input.login]
  );

  if (existingLogin.rows[0]) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.");
  }

  const slug = await ensureUniqueAccountSlug(pool, input.companyName);
  const passwordHash = hashPassword(input.password);

  const accountResult = await pool.query<Account>(
    `
      insert into accounts (name, slug)
      values ($1, $2)
      returning id::text, name, slug, created_at::text, updated_at::text
    `,
    [input.companyName, slug]
  );

  const account = accountResult.rows[0];

  const userResult = await pool.query<StoredAdminUser>(
    `
      insert into admin_users (id, account_id, name, login, password_hash, role, status, accepted_at, updated_at)
      values ((select coalesce(max(id), 0) + 1 from admin_users), $1, $2, $3, $4, 'owner', 'active', now(), now())
      returning
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
    `,
    [account.id, input.ownerName, input.login, passwordHash]
  );

  return {
    account,
    user: mapAdminUser(userResult.rows[0])
  };
}

async function readActiveStoredAdminUser(login?: string) {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      where status = 'active'
        and password_hash <> ''
        and ($1::text is null or lower(login) = lower($1))
      order by id::text asc
      limit 1
    `,
    [login ?? null]
  );

  return rows[0] ?? null;
}

async function readActiveStoredAdminUserById(userId: string, accountId: string) {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      where id::text = $1
        and account_id = $2
        and status = 'active'
        and password_hash <> ''
      limit 1
    `,
    [userId, accountId]
  );

  return rows[0] ?? null;
}

async function resolveAdminCredentials(login?: string): Promise<ResolvedCredentials | null> {
  let storedUser: StoredAdminUser | null = null;

  try {
    storedUser = await readActiveStoredAdminUser(login);
  } catch (error) {
    logger.error("PostgreSQL admin user lookup failed", error, { login: login ?? null });
  }

  if (storedUser) {
    return {
      id: String(storedUser.id),
      accountId: storedUser.account_id ?? DEFAULT_ACCOUNT_ID,
      name: storedUser.name ?? storedUser.login,
      login: storedUser.login,
      role: storedUser.role ?? "owner",
      passwordHash: storedUser.password_hash,
      plainPassword: null,
      source: "database"
    };
  }

  const envLogin = getEnvAdminLogin();
  const envPassword = getEnvAdminPassword();

  if (!envLogin || !envPassword || (login && login !== envLogin)) {
    return null;
  }

  return {
    id: "env-admin",
    accountId: DEFAULT_ACCOUNT_ID,
    name: envLogin,
    login: envLogin,
    role: "owner",
    passwordHash: null,
    plainPassword: envPassword,
    source: "environment"
  };
}

export async function isAdminAuthConfigured() {
  return (
    Boolean(await resolveAdminCredentials()) &&
    Boolean(process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim())
  );
}

export async function getAdminAuthConfigError() {
  const credentials = await resolveAdminCredentials();
  const missing = [
    !credentials ? "credenciais administrativas (banco ou variáveis ADMIN_EMAIL/ADMIN_USERNAME e ADMIN_PASSWORD)" : null,
    !(process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim())
      ? "AUTH_SESSION_SECRET ou SESSION_SECRET"
      : null
  ].filter(Boolean);

  return missing.length ? `Autenticação administrativa incompleta. Defina: ${missing.join(", ")}.` : null;
}

export async function getAdminAccountInfo(sessionUserId?: string, sessionAccountId = DEFAULT_ACCOUNT_ID): Promise<AdminAccountInfo> {
  const sessionUser =
    sessionUserId && sessionUserId !== "env-admin"
      ? await readActiveStoredAdminUserById(sessionUserId, sessionAccountId)
      : null;
  const credentials = sessionUser
    ? {
        login: sessionUser.login,
        source: "database" as const
      }
    : await resolveAdminCredentials();

  return {
    login: credentials?.login ?? null,
    credentialSource: credentials?.source ?? null
  };
}

export async function validateAdminCredentials(login: string, password: string) {
  const credentials = await resolveAdminCredentials(login);

  if (!credentials || login !== credentials.login) {
    return {
      valid: false,
      login: null as string | null,
      userId: null as string | null,
      accountId: null as string | null,
      role: null as AdminRole | null
    };
  }

  const valid =
    credentials.source === "database"
      ? verifyHashedPassword(password, credentials.passwordHash ?? "")
      : password === credentials.plainPassword;

  return {
    valid,
    login: valid ? credentials.login : null,
    userId: valid ? credentials.id : null,
    accountId: valid ? credentials.accountId : null,
    role: valid ? credentials.role : null
  };
}

export async function createAccountWithOwner(input: CreateAccountInput): Promise<{ account: Account; user: AdminUser }> {
  const pool = requirePool();

  try {
    await pool.query("begin");
    const result = await provisionAccountWithOwner(pool, input);
    await pool.query("commit");
    await initializeProvisionedAccount(result.account);
    return result;
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }
}

export async function updateAdminPassword(
  currentPassword: string,
  nextPassword: string,
  sessionUserId?: string,
  sessionAccountId = DEFAULT_ACCOUNT_ID
) {
  const sessionUser =
    sessionUserId && sessionUserId !== "env-admin"
      ? await readActiveStoredAdminUserById(sessionUserId, sessionAccountId)
      : null;
  const credentials = sessionUser
    ? {
        id: String(sessionUser.id),
        accountId: sessionUser.account_id ?? DEFAULT_ACCOUNT_ID,
        name: sessionUser.name ?? sessionUser.login,
        login: sessionUser.login,
        role: sessionUser.role ?? "owner",
        passwordHash: sessionUser.password_hash,
        plainPassword: null,
        source: "database" as const
      }
    : await resolveAdminCredentials();

  if (!credentials) {
    throw new Error("Autenticação administrativa não configurada.");
  }

  const currentPasswordMatches =
    credentials.source === "database"
      ? verifyHashedPassword(currentPassword, credentials.passwordHash ?? "")
      : currentPassword === credentials.plainPassword;

  if (!currentPasswordMatches) {
    throw new Error("A senha atual não confere.");
  }

  if (credentials.source !== "database") {
    throw new Error(
      "Não é permitido alterar a senha de uma credencial baseada em variáveis de ambiente pelo painel. Atualize a variável segura do ambiente ou migre para um usuário do banco."
    );
  }

  const pool = requirePool();
  const passwordHash = hashPassword(nextPassword);

  if (credentials.source === "database") {
    await pool.query(
      `
        update admin_users
        set password_hash = $2, updated_at = now()
        where id::text = $1
      `,
      [credentials.id, passwordHash]
    );
  }

  return {
    login: credentials.login,
    credentialSource: "database" as const
  };
}

export async function listAdminUsers(accountId = DEFAULT_ACCOUNT_ID): Promise<AdminUser[]> {
  const pool = getPool();

  if (!pool) {
    return [];
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      where account_id = $1
      order by created_at asc, id::text asc
    `,
    [accountId]
  );

  return rows.map(mapAdminUser);
}

export async function getAdminUserById(id: string, accountId = DEFAULT_ACCOUNT_ID): Promise<AdminUser | null> {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      where id::text = $1
        and account_id = $2
      limit 1
    `,
    [id, accountId]
  );

  return rows[0] ? mapAdminUser(rows[0]) : null;
}

export async function countActiveOwners(accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();
  const { rows } = await pool.query<{ count: string }>(
    `
      select count(*)::text
      from admin_users
      where account_id = $1
        and role = 'owner'
        and status = 'active'
    `,
    [accountId]
  );

  return Number(rows[0]?.count ?? 0);
}

export async function createAdminInvite(
  input: { name: string; login: string; role: AdminRole },
  accountId = DEFAULT_ACCOUNT_ID,
  requestOrigin?: string
): Promise<AdminInviteResult> {
  const pool = requirePool();

  const token = randomBytes(32).toString("base64url");
  const inviteTokenHash = hashInviteToken(token);

  const existing = await pool.query<{ id: string; account_id: string; status: string }>(
    `
      select id::text, account_id::text, status
      from admin_users
      where lower(login) = lower($1)
      limit 1
    `,
    [input.login]
  );

  if (existing.rows[0] && existing.rows[0].account_id !== accountId) {
    throw new Error("Este e-mail já está cadastrado em outra conta.");
  }

  if (existing.rows[0]?.status === "active") {
    throw new Error("Já existe um usuário ativo com este e-mail.");
  }

  const { rows } = await pool.query<StoredAdminUser>(
    existing.rows[0]
      ? `
          update admin_users
          set
            name = $2,
            role = $3,
            status = 'pending',
            password_hash = '',
            invite_token_hash = $4,
            invited_at = now(),
            accepted_at = null,
            updated_at = now()
          where id::text = $1
          returning
            id::text,
            account_id::text,
            name,
            login,
            password_hash,
            role,
            status,
            created_at::text,
            updated_at::text,
            invited_at::text,
            accepted_at::text
        `
      : `
          insert into admin_users (
            id,
            account_id,
            name,
            login,
            password_hash,
            role,
            status,
            invite_token_hash,
            invited_at,
            updated_at
          )
          values (
            (select coalesce(max(id), 0) + 1 from admin_users),
            $5,
            $2,
            $1,
            '',
            $3,
            'pending',
            $4,
            now(),
            now()
          )
          returning
            id::text,
            account_id::text,
            name,
            login,
            password_hash,
            role,
            status,
            created_at::text,
            updated_at::text,
            invited_at::text,
            accepted_at::text
        `,
    existing.rows[0]
      ? [existing.rows[0].id, input.name, input.role, inviteTokenHash]
      : [input.login, input.name, input.role, inviteTokenHash, accountId]
  );

  return {
    user: mapAdminUser(rows[0]),
    inviteUrl: buildInviteUrl(token, requestOrigin)
  };
}

export async function createAccountOwnerInvite(
  input: { companyName: string; ownerName: string; login: string },
  inviterAccountId = DEFAULT_ACCOUNT_ID,
  inviterUserId?: string,
  requestOrigin?: string
): Promise<AccountOwnerInviteResult> {
  const pool = requirePool();
  const token = randomBytes(32).toString("base64url");
  const inviteTokenHash = hashInviteToken(token);

  const [existingAdminUser, existingInvite] = await Promise.all([
    pool.query<{ id: string }>(
      `
        select id::text
        from admin_users
        where lower(login) = lower($1)
        limit 1
      `,
      [input.login]
    ),
    pool.query<StoredAccountOwnerInvite>(
      `
        select
          id::text,
          inviter_account_id::text,
          inviter_user_id,
          company_name,
          owner_name,
          login,
          status,
          created_account_id::text,
          created_user_id,
          invited_at::text,
          accepted_at::text,
          created_at::text,
          updated_at::text
        from account_owner_invites
        where lower(login) = lower($1)
          and status = 'pending'
        order by created_at desc
        limit 1
      `,
      [input.login]
    )
  ]);

  if (existingAdminUser.rows[0]) {
    throw new Error("Este e-mail já está em uso por uma conta existente.");
  }

  const { rows } = await pool.query<StoredAccountOwnerInvite>(
    existingInvite.rows[0]
      ? `
          update account_owner_invites
          set
            inviter_account_id = $2,
            inviter_user_id = $3,
            company_name = $4,
            owner_name = $5,
            status = 'pending',
            created_account_id = null,
            created_user_id = null,
            invite_token_hash = $6,
            invited_at = now(),
            accepted_at = null,
            updated_at = now()
          where id = $1
          returning
            id::text,
            inviter_account_id::text,
            inviter_user_id,
            company_name,
            owner_name,
            login,
            status,
            created_account_id::text,
            created_user_id,
            invited_at::text,
            accepted_at::text,
            created_at::text,
            updated_at::text
        `
      : `
          insert into account_owner_invites (
            inviter_account_id,
            inviter_user_id,
            company_name,
            owner_name,
            login,
            invite_token_hash,
            status,
            invited_at,
            updated_at
          )
          values ($1, $2, $3, $4, $5, $6, 'pending', now(), now())
          returning
            id::text,
            inviter_account_id::text,
            inviter_user_id,
            company_name,
            owner_name,
            login,
            status,
            created_account_id::text,
            created_user_id,
            invited_at::text,
            accepted_at::text,
            created_at::text,
            updated_at::text
        `,
    existingInvite.rows[0]
      ? [
          existingInvite.rows[0].id,
          inviterAccountId,
          inviterUserId ?? null,
          input.companyName,
          input.ownerName,
          inviteTokenHash
        ]
      : [inviterAccountId, inviterUserId ?? null, input.companyName, input.ownerName, input.login, inviteTokenHash]
  );

  return {
    invite: mapAccountOwnerInvite(rows[0]),
    inviteUrl: buildAccountInviteUrl(token, requestOrigin)
  };
}

export async function getPendingAccountOwnerInvite(token: string): Promise<AccountOwnerInvite | null> {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  const inviteTokenHash = hashInviteToken(token);

  const { rows } = await pool.query<StoredAccountOwnerInvite>(
    `
      select
        id::text,
        inviter_account_id::text,
        inviter_user_id,
        company_name,
        owner_name,
        login,
        status,
        created_account_id::text,
        created_user_id,
        invited_at::text,
        accepted_at::text,
        created_at::text,
        updated_at::text
      from account_owner_invites
      where invite_token_hash = $1
        and status = 'pending'
      limit 1
    `,
    [inviteTokenHash]
  );

  return rows[0] ? mapAccountOwnerInvite(rows[0]) : null;
}

export async function acceptAdminInvite(token: string, password: string) {
  const pool = requirePool();

  const inviteTokenHash = hashInviteToken(token);
  const passwordHash = hashPassword(password);

  const { rows } = await pool.query<StoredAdminUser>(
    `
      update admin_users
      set
        password_hash = $2,
        status = 'active',
        invite_token_hash = null,
        accepted_at = now(),
        updated_at = now()
      where invite_token_hash = $1
        and status = 'pending'
      returning
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
    `,
    [inviteTokenHash, passwordHash]
  );

  if (!rows[0]) {
    throw new Error("Convite inválido ou já utilizado.");
  }

  return mapAdminUser(rows[0]);
}

export async function acceptAccountOwnerInvite(token: string, password: string) {
  const pool = requirePool();
  const inviteTokenHash = hashInviteToken(token);

  try {
    await pool.query("begin");

    const inviteResult = await pool.query<StoredAccountOwnerInvite>(
      `
        select
          id::text,
          inviter_account_id::text,
          inviter_user_id,
          company_name,
          owner_name,
          login,
          status,
          created_account_id::text,
          created_user_id,
          invited_at::text,
          accepted_at::text,
          created_at::text,
          updated_at::text
        from account_owner_invites
        where invite_token_hash = $1
          and status = 'pending'
        limit 1
        for update
      `,
      [inviteTokenHash]
    );

    const invite = inviteResult.rows[0];

    if (!invite) {
      throw new Error("Convite de empresa inválido ou já utilizado.");
    }

    const result = await provisionAccountWithOwner(pool, {
      companyName: invite.company_name,
      ownerName: invite.owner_name,
      login: invite.login,
      password
    });

    await pool.query(
      `
        update account_owner_invites
        set
          status = 'accepted',
          invite_token_hash = invite_token_hash,
          created_account_id = $2,
          created_user_id = $3,
          accepted_at = now(),
          updated_at = now()
        where id = $1
      `,
      [invite.id, result.account.id, result.user.id]
    );

    await pool.query("commit");
    await initializeProvisionedAccount(result.account);

    return {
      invite: mapAccountOwnerInvite({
        ...invite,
        status: "accepted",
        created_account_id: result.account.id,
        created_user_id: result.user.id,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }),
      account: result.account,
      user: result.user
    };
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }
}

export async function updateAdminUserStatus(id: string, status: "active" | "inactive", accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();

  const { rows } = await pool.query<StoredAdminUser>(
    `
      update admin_users
      set status = $2, updated_at = now()
      where id::text = $1 and account_id = $3
      returning
        id::text,
        account_id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
    `,
    [id, status, accountId]
  );

  if (!rows[0]) {
    throw new Error("Usuário não encontrado.");
  }

  return mapAdminUser(rows[0]);
}
