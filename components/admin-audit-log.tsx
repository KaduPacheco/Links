"use client";

import { useMemo, useState, useTransition } from "react";
import { Activity, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  adminAuditActionOptions,
  adminAuditTimeRangeOptions,
  defaultAdminAuditFilters,
  getAdminAuditActionLabel,
  getAdminAuditSeverity,
  type AdminAuditEvent,
  type AdminAuditFilters,
  type AdminAuditPage,
  type AdminAuditSeverity
} from "@/types/admin-audit";

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

function severityLabel(severity: AdminAuditSeverity) {
  if (severity === "critical") {
    return "Critico";
  }

  if (severity === "warning") {
    return "Atencao";
  }

  return "Info";
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

function severityStyles(severity: AdminAuditSeverity) {
  if (severity === "critical") {
    return {
      panel: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
    };
  }

  if (severity === "warning") {
    return {
      panel: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    };
  }

  return {
    panel: "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
  };
}

function EventItem({ event }: { event: AdminAuditEvent }) {
  const severity = getAdminAuditSeverity(event.action);
  const styles = severityStyles(severity);

  return (
    <article className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.panel}`}>
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950 dark:text-slate-50">{getAdminAuditActionLabel(event.action)}</h3>
            <Badge className={styles.badge}>{severityLabel(severity)}</Badge>
            <Badge>{roleLabel(event.actor_role)}</Badge>
            {event.target_type && (
              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{event.target_type}</Badge>
            )}
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
  const [filters, setFilters] = useState<AdminAuditFilters>(defaultAdminAuditFilters);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const severity = getAdminAuditSeverity(event.action);
        acc.total += 1;
        acc[severity] += 1;
        return acc;
      },
      { total: 0, critical: 0, warning: 0, info: 0 }
    );
  }, [events]);

  async function loadPage(mode: "replace" | "append", nextFilters = filters) {
    setMessage(null);
    const params = new URLSearchParams({
      limit: "25",
      action: nextFilters.action,
      actor: nextFilters.actor,
      timeRange: nextFilters.timeRange
    });

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

  function applyFilters() {
    startTransition(async () => {
      try {
        await loadPage("replace");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nao foi possivel filtrar a auditoria.");
      }
    });
  }

  function clearFilters() {
    const nextFilters = defaultAdminAuditFilters;
    setFilters(nextFilters);

    startTransition(async () => {
      try {
        await loadPage("replace", nextFilters);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nao foi possivel limpar os filtros.");
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
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Eventos</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-200">Criticos</p>
            <p className="mt-2 text-2xl font-black text-red-700 dark:text-red-200">{summary.critical}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">Atencao</p>
            <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-200">{summary.warning}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-sky-200">Info</p>
            <p className="mt-2 text-2xl font-black text-blue-700 dark:text-sky-200">{summary.info}</p>
          </div>
        </div>

        {summary.critical > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Eventos criticos encontrados nos filtros atuais. Vale revisar falhas de login e bloqueios recentes.
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 rounded-2xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1fr_160px_auto_auto]">
          <div className="space-y-2">
            <Label htmlFor="audit-action">Acao</Label>
            <Select
              id="audit-action"
              value={filters.action}
              onChange={(event) =>
                setFilters((current) => ({ ...current, action: event.target.value as AdminAuditFilters["action"] }))
              }
            >
              {adminAuditActionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-actor">Ator</Label>
            <Input
              id="audit-actor"
              value={filters.actor}
              onChange={(event) => setFilters((current) => ({ ...current, actor: event.target.value }))}
              placeholder="email ou login"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-time-range">Periodo</Label>
            <Select
              id="audit-time-range"
              value={filters.timeRange}
              onChange={(event) =>
                setFilters((current) => ({ ...current, timeRange: event.target.value as AdminAuditFilters["timeRange"] }))
              }
            >
              {adminAuditTimeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={applyFilters} disabled={isPending}>
              Filtrar
            </Button>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="ghost" onClick={clearFilters} disabled={isPending}>
              Limpar
            </Button>
          </div>
        </div>

        {message && (
          <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
            {message}
          </p>
        )}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Nenhum evento de auditoria encontrado para os filtros atuais.
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
