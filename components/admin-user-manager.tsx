"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Building2, CheckCircle2, Copy, MailPlus, RefreshCw, UserRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AdminInviteResult, AdminRole, AdminUser } from "@/types/admin-user";
import type { AccountOwnerInviteResult } from "@/types/account-invite";

type AdminUserManagerProps = {
  initialUsers: AdminUser[];
  currentRole: AdminRole;
};

type InviteForm = {
  name: string;
  login: string;
  role: AdminRole;
};

type AccountInviteForm = {
  companyName: string;
  ownerName: string;
  login: string;
};

const emptyInviteForm: InviteForm = {
  name: "",
  login: "",
  role: "editor"
};

const emptyAccountInviteForm: AccountInviteForm = {
  companyName: "",
  ownerName: "",
  login: ""
};

function redirectToLogin() {
  window.location.assign("/admin/login?next=/admin");
}

async function readJsonOrThrow<T>(response: Response) {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Sessao expirada.");
  }

  return (await response.json()) as T;
}

function statusLabel(status: AdminUser["status"]) {
  if (status === "active") {
    return "Ativo";
  }

  if (status === "pending") {
    return "Pendente";
  }

  return "Inativo";
}

function roleLabel(role: AdminRole) {
  if (role === "owner") {
    return "Dono";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "Editor";
}

export function AdminUserManager({ initialUsers, currentRole }: AdminUserManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [teamInviteForm, setTeamInviteForm] = useState<InviteForm>(emptyInviteForm);
  const [accountInviteForm, setAccountInviteForm] = useState<AccountInviteForm>(emptyAccountInviteForm);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [teamInviteUrl, setTeamInviteUrl] = useState<string | null>(null);
  const [accountInviteUrl, setAccountInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [users]
  );
  const canCreateInvites = currentRole !== "editor";
  const canInviteAccounts = currentRole === "owner";

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = await readJsonOrThrow<{ data: AdminUser[] }>(response);
    setUsers(payload.data ?? []);
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeamMessage(null);
    setTeamInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamInviteForm)
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: AdminInviteResult }>(response);

      if (!response.ok || !payload.data) {
        setTeamMessage(payload.error ?? "Nao foi possivel criar o convite.");
        return;
      }

      await loadUsers();
      setTeamInviteForm(emptyInviteForm);
      setTeamInviteUrl(payload.data.inviteUrl);
      setTeamMessage("Convite interno criado. Envie o link para a pessoa definir a senha.");
    });
  }

  async function createAccountInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountMessage(null);
    setAccountInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/account-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountInviteForm)
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: AccountOwnerInviteResult }>(response);

      if (!response.ok || !payload.data) {
        setAccountMessage(payload.error ?? "Nao foi possivel criar o convite da empresa.");
        return;
      }

      setAccountInviteForm(emptyAccountInviteForm);
      setAccountInviteUrl(payload.data.inviteUrl);
      setAccountMessage("Convite da nova empresa criado. Esse link gera uma conta separada.");
    });
  }

  async function updateStatus(user: AdminUser, status: "active" | "inactive") {
    setTeamMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: AdminUser }>(response);

      if (!response.ok || !payload.data) {
        setTeamMessage(payload.error ?? "Nao foi possivel atualizar o usuario.");
        return;
      }

      await loadUsers();
      setTeamMessage(status === "active" ? "Usuario reativado." : "Usuario inativado.");
    });
  }

  async function copyInviteUrl(inviteUrl: string | null, successMessage: string, target: "team" | "account") {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);

    if (target === "team") {
      setTeamMessage(successMessage);
      return;
    }

    setAccountMessage(successMessage);
  }

  return (
    <div className={canCreateInvites ? "grid gap-6 lg:grid-cols-[380px_1fr]" : "grid gap-6"}>
      {canCreateInvites && (
        <div className="space-y-6">
          {canInviteAccounts && (
            <Card className="h-fit border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                  Convidar empresa
                </CardTitle>
                <CardDescription>
                  Gere um link privado para uma nova empresa criar uma conta separada, com links e dados proprios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={createAccountInvite}>
                  <div className="space-y-2">
                    <Label htmlFor="account-company-name">Empresa</Label>
                    <Input
                      id="account-company-name"
                      value={accountInviteForm.companyName}
                      onChange={(event) => setAccountInviteForm({ ...accountInviteForm, companyName: event.target.value })}
                      placeholder="Nome da nova empresa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-owner-name">Responsavel</Label>
                    <Input
                      id="account-owner-name"
                      value={accountInviteForm.ownerName}
                      onChange={(event) => setAccountInviteForm({ ...accountInviteForm, ownerName: event.target.value })}
                      placeholder="Nome da pessoa responsavel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-login">E-mail</Label>
                    <Input
                      id="account-login"
                      type="email"
                      value={accountInviteForm.login}
                      onChange={(event) => setAccountInviteForm({ ...accountInviteForm, login: event.target.value })}
                      placeholder="responsavel@empresa.com"
                      required
                    />
                  </div>

                  {accountInviteUrl && (
                    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                      <p className="break-all text-xs font-semibold leading-5 text-blue-800 dark:text-sky-100">
                        {accountInviteUrl}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => copyInviteUrl(accountInviteUrl, "Link da nova empresa copiado.", "account")}
                      >
                        <Copy className="h-4 w-4" />
                        Copiar link
                      </Button>
                    </div>
                  )}

                  {accountMessage && (
                    <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                      {accountMessage}
                    </p>
                  )}

                  <Button type="submit" disabled={isPending}>
                    <Building2 className="h-4 w-4" />
                    {isPending ? "Criando..." : "Criar convite da empresa"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="h-fit border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailPlus className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                Convidar membro da equipe
              </CardTitle>
              <CardDescription>Crie um convite interno para a pessoa definir senha no primeiro acesso desta conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={createInvite}>
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Nome</Label>
                  <Input
                    id="invite-name"
                    value={teamInviteForm.name}
                    onChange={(event) => setTeamInviteForm({ ...teamInviteForm, name: event.target.value })}
                    placeholder="Nome do usuario"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-login">E-mail</Label>
                  <Input
                    id="invite-login"
                    type="email"
                    value={teamInviteForm.login}
                    onChange={(event) => setTeamInviteForm({ ...teamInviteForm, login: event.target.value })}
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">Perfil</Label>
                  <Select
                    id="invite-role"
                    value={teamInviteForm.role}
                    onChange={(event) => setTeamInviteForm({ ...teamInviteForm, role: event.target.value as AdminRole })}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Dono</option>
                  </Select>
                </div>

                {teamInviteUrl && (
                  <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                    <p className="break-all text-xs font-semibold leading-5 text-blue-800 dark:text-sky-100">{teamInviteUrl}</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => copyInviteUrl(teamInviteUrl, "Link do membro copiado.", "team")}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </Button>
                  </div>
                )}

                {teamMessage && (
                  <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                    {teamMessage}
                  </p>
                )}

                <Button type="submit" disabled={isPending}>
                  <MailPlus className="h-4 w-4" />
                  {isPending ? "Criando..." : "Criar convite"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usuarios do painel</CardTitle>
            <CardDescription>Controle quem pode acessar esta conta e seus links administrativos.</CardDescription>
          </div>
          <Button type="button" variant="secondary" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedUsers.map((user) => (
            <article
              key={user.id}
              className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-300">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-950 dark:text-slate-50">{user.name}</h3>
                    <Badge>{roleLabel(user.role)}</Badge>
                    <Badge
                      className={
                        user.status === "active"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }
                    >
                      {statusLabel(user.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{user.login}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Convite: {user.invited_at ? new Date(user.invited_at).toLocaleDateString("pt-BR") : "Conta principal"}
                    {" | "}
                    Aceite: {user.accepted_at ? new Date(user.accepted_at).toLocaleDateString("pt-BR") : "Pendente"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {user.status === "inactive" ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => updateStatus(user, "active")}>
                    <CheckCircle2 className="h-4 w-4" />
                    Reativar
                  </Button>
                ) : (
                  <Button type="button" variant="destructive" size="sm" onClick={() => updateStatus(user, "inactive")}>
                    <XCircle className="h-4 w-4" />
                    Inativar
                  </Button>
                )}
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
