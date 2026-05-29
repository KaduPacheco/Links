"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BarChart3, MousePointerClick, RefreshCw, ShieldAlert, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getCategoryLabel } from "@/types/link";
import type { TenantDashboardAlert, TenantDashboardData } from "@/types/tenant-dashboard";

type AdminTenantDashboardProps = {
  initialData: TenantDashboardData;
};

function redirectToLogin() {
  window.location.assign("/admin/login?next=/admin");
}

async function readJsonOrThrow<T>(response: Response) {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Sessão expirada.");
  }

  return (await response.json()) as T;
}

function alertStyles(severity: TenantDashboardAlert["severity"]) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }

  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
}

function maxTrendValue(data: TenantDashboardData) {
  return Math.max(
    1,
    ...data.trends.flatMap((item) => [item.clicks, item.successfulLogins, item.failedLogins])
  );
}

export function AdminTenantDashboard({ initialData }: AdminTenantDashboardProps) {
  const [dashboard, setDashboard] = useState(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trendMax = maxTrendValue(dashboard);

  function refresh() {
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const payload = await readJsonOrThrow<{ data?: TenantDashboardData; error?: string }>(response);

        if (!response.ok || !payload.data) {
          setMessage(payload.error ?? "Não foi possível atualizar o dashboard.");
          return;
        }

        setDashboard(payload.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o dashboard.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Badge>Visão SaaS da conta</Badge>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Uso da conta por tenant</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Acompanhe adoção, atividade recente, saúde operacional e sinais de risco desta conta.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Atualizado em {formatDateTime(dashboard.generatedAt)}
          </p>
          <Button type="button" variant="secondary" onClick={refresh} disabled={isPending}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {message && (
        <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
          {message}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Links ativos</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              {dashboard.overview.activeLinks}/{dashboard.overview.totalLinks}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cliques últimos 7 dias</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              {dashboard.overview.clicksLast7Days}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Membros ativos</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              {dashboard.overview.activeMembers}/{dashboard.overview.teamMembers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Eventos críticos 24h</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-300" />
              {dashboard.overview.criticalEventsLast24h}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tendência dos últimos 7 dias</CardTitle>
            <CardDescription>Cliques e autenticações diárias da conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.trends.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sem dados suficientes para montar tendência.</p>
            ) : (
              <div className="space-y-4">
                {dashboard.trends.map((point) => (
                  <div key={point.date} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{point.label}</span>
                      <span>
                        {point.clicks} cliques | {point.successfulLogins} logins | {point.failedLogins} falhas
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-blue-600 dark:bg-sky-300"
                          style={{ width: `${Math.max((point.clicks / trendMax) * 100, point.clicks > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-300"
                          style={{
                            width: `${Math.max((point.successfulLogins / trendMax) * 100, point.successfulLogins > 0 ? 6 : 0)}%`
                          }}
                        />
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-red-500 dark:bg-red-300"
                          style={{
                            width: `${Math.max((point.failedLogins / trendMax) * 100, point.failedLogins > 0 ? 6 : 0)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas da conta</CardTitle>
            <CardDescription>Sinais recentes de risco, fricção ou baixa adoção.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.alerts.map((alert) => (
              <div key={alert.id} className={`rounded-2xl border p-4 ${alertStyles(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold">{alert.title}</p>
                    <p className="mt-1 text-sm leading-6">{alert.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Links com maior tração</CardTitle>
            <CardDescription>Top links por volume acumulado de cliques.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.topLinks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum link encontrado para esta conta.</p>
            ) : (
              dashboard.topLinks.map((link, index) => (
                <article
                  key={link.id}
                  className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[auto_1fr_auto] dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white dark:bg-sky-400 dark:text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950 dark:text-slate-50">{link.title}</h3>
                      <Badge>{getCategoryLabel(link.category)}</Badge>
                      {!link.isActive && (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Inativo</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Último clique: {formatDateTime(link.lastClickedAt)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-blue-700 dark:text-sky-300">{link.clickCount}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">cliques</p>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição por categoria</CardTitle>
            <CardDescription>Distribuição de links e tração por categoria da conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.categories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sem categorias para exibir.</p>
            ) : (
              dashboard.categories.map((category) => (
                <article key={category.category} className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950 dark:text-slate-50">{getCategoryLabel(category.category)}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {category.activeLinks}/{category.totalLinks} ativos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-700 dark:text-sky-300">{category.totalClicks}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">cliques</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Cliques totais</CardDescription>
            <CardTitle>{dashboard.overview.totalClicks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cliques últimos 30 dias</CardDescription>
            <CardTitle>{dashboard.overview.clicksLast30Days}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Logins bem-sucedidos 7 dias</CardDescription>
            <CardTitle>{dashboard.overview.successfulLoginsLast7Days}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Falhas e bloqueios 7 dias</CardDescription>
            <CardTitle>{dashboard.overview.failedLoginsLast7Days + dashboard.overview.rateLimitedLoginsLast7Days}</CardTitle>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
