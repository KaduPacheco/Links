"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Copy, MailPlus, RefreshCw, UserRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AdminInviteResult, AdminRole, AdminUser } from "@/types/admin-user";

type AdminUserManagerProps = {
  initialUsers: AdminUser[];
  currentRole: AdminRole;
};

type InviteForm = {
  name: string;
  login: string;
  role: AdminRole;
};

const emptyInviteForm: InviteForm = {
  name: "",
  login: "",
  role: "editor"
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
  const [form, setForm] = useState<InviteForm>(emptyInviteForm);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [users]
  );
  const canCreateInvites = currentRole !== "editor";

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = await readJsonOrThrow<{ data: AdminUser[] }>(response);
    setUsers(payload.data ?? []);
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: AdminInviteResult }>(response);

      if (!response.ok || !payload.data) {
        setMessage(payload.error ?? "Nao foi possivel criar o convite.");
        return;
      }

      await loadUsers();
      setForm(emptyInviteForm);
      setInviteUrl(payload.data.inviteUrl);
      setMessage("Convite criado. Envie o link para o usuario definir a senha.");
    });
  }

  async function updateStatus(user: AdminUser, status: "active" | "inactive") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: AdminUser }>(response);

      if (!response.ok || !payload.data) {
        setMessage(payload.error ?? "Nao foi possivel atualizar o usuario.");
        return;
      }

      await loadUsers();
      setMessage(status === "active" ? "Usuario reativado." : "Usuario inativado.");
    });
  }

  async function copyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    setMessage("Link copiado.");
  }

  return (
    <div className={canCreateInvites ? "grid gap-6 lg:grid-cols-[380px_1fr]" : "grid gap-6"}>
      {canCreateInvites && (
      <Card className="h-fit border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-5 w-5 text-blue-600 dark:text-sky-300" />
            Convidar usuario
          </CardTitle>
          <CardDescription>Crie um convite interno para a pessoa definir senha no primeiro acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={createInvite}>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome</Label>
              <Input
                id="invite-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Nome do usuario"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-login">E-mail</Label>
              <Input
                id="invite-login"
                type="email"
                value={form.login}
                onChange={(event) => setForm({ ...form, login: event.target.value })}
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Perfil</Label>
              <Select
                id="invite-role"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="owner">Dono</option>
              </Select>
            </div>

            {inviteUrl && (
              <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                <p className="break-all text-xs font-semibold leading-5 text-blue-800 dark:text-sky-100">{inviteUrl}</p>
                <Button type="button" variant="secondary" size="sm" onClick={copyInviteUrl}>
                  <Copy className="h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            )}

            {message && (
              <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                {message}
              </p>
            )}

            <Button type="submit" disabled={isPending}>
              <MailPlus className="h-4 w-4" />
              {isPending ? "Criando..." : "Criar convite"}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usuarios do painel</CardTitle>
            <CardDescription>Controle quem pode acessar a area administrativa.</CardDescription>
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
