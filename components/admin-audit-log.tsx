"use client";

import { useState, useTransition } from "react";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { AdminAuditEvent, AdminAuditPage } from "@/types/admin-audit";

type AdminAuditLogProps = {
  initialPage: AdminAuditPage;
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

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    "auth.login.succeeded": "Login realizado",
    "auth.login.failed": "Login falhou",
    "auth.login.rate_limited": "Login bloqueado",
    "auth.logout": "Logout",
    "auth.signup.succeeded": "Conta criada",
    "auth.invite.accepted": "Convite aceito",
    "admin.password.updated": "Senha atualizada",
    "admin.settings.updated": "Configuracoes salvas",
    "admin.user.invited": "Usuario convidado",
    "admin.user.status_updated": "Status de usuario alterado",
    "admin.link.created": "Link criado",
    "admin.link.updated": "Link atualizado",
    "admin.link.deleted": "Link removido"
  };

  return labels[action] ?? action;
}

function roleLabel(role: string | null) {
  if (role === "owner") {
    return "Dono";
  }

  if (role === "admin") {
    return "Admin";
  }

  if (role === "editor") {
    return "Editor";
  }

  return "Sistema";
}

function metadataSummary(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== "");

  if (entries.length === 0) {
    return null;
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

function EventItem({ event }: { event: AdminAuditEvent }) {
  return (
    <article className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-slate-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950 dark:text-slate-50">{actionLabel(event.action)}</h3>
            <Badge>{roleLabel(event.actor_role)}</Badge>
            {event.target_type && <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{event.target_type}</Badge>}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {event.actor_login ?? "Sistema"}
            {event.target_id ? ` | alvo ${event.target_id}` : ""}
          </p>
          {metadataSummary(event.metadata) && (
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{metadataSummary(event.metadata)}</p>
          )}
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            IP: {event.ip_address ?? "N/D"}
            {" | "}
            UA: {event.user_agent ? event.user_agent.slice(0, 80) : "N/D"}
          </p>
        </div>
      </div>

      <div className="text-left lg:text-right">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDateTime(event.created_at)}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.id.slice(0, 8)}</p>
      </div>
    </article>
  );
}

export function AdminAuditLog({ initialPage }: AdminAuditLogProps) {
  const [events, setEvents] = useState<AdminAuditEvent[]>(initialPage.data);
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadPage(mode: "replace" | "append") {
    setMessage(null);
    const params = new URLSearchParams({ limit: "25" });

    if (mode === "append" && nextCursor) {
      params.set("before", nextCursor);
    }

    const response = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
    const payload = await readJsonOrThrow<AdminAuditPage & { error?: string }>(response);

    if (!response.ok) {
      throw new Error(payload.error ?? "Nao foi possivel carregar a auditoria.");
    }

    setEvents((current) => (mode === "replace" ? payload.data : [...current, ...payload.data]));
    setNextCursor(payload.nextCursor);
  }

  function refresh() {
    startTransition(async () => {
      try {
        await loadPage("replace");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a auditoria.");
      }
    });
  }

  function loadMore() {
    startTransition(async () => {
      try {
        await loadPage("append");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar mais eventos.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            Auditoria administrativa
          </CardTitle>
          <CardDescription>Eventos recentes de autenticacao e alteracoes sensiveis na conta.</CardDescription>
        </div>
        <Button type="button" variant="secondary" onClick={refresh} disabled={isPending}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
            {message}
          </p>
        )}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhum evento de auditoria encontrado para esta conta.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}

        {nextCursor && (
          <Button type="button" variant="secondary" onClick={loadMore} disabled={isPending}>
            Carregar mais
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
