import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Clock, Trophy } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { BrandMark } from "@/components/brand-mark";
import { LinkIcon } from "@/components/icon-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminIdleTimeoutMinutes } from "@/lib/auth";
import { readAdminSession } from "@/lib/admin-session";
import { getLinksWithAnalytics } from "@/lib/links";
import { getSiteSettingsForAccount } from "@/lib/site-settings";
import { formatDateTime } from "@/lib/utils";
import { getCategoryLabel } from "@/types/link";

export default async function AnalyticsPage() {
  const session = await readAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/analytics");
  }

  const accountId = session.account_id;
  const idleTimeoutMinutes = getAdminIdleTimeoutMinutes();
  const [links, settings] = await Promise.all([getLinksWithAnalytics(true, accountId), getSiteSettingsForAccount(accountId)]);
  const rankedLinks = [...links].sort((a, b) => b.click_count - a.click_count);
  const totalClicks = links.reduce((sum, link) => sum + link.click_count, 0);
  const leader = rankedLinks[0];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <AdminSessionGuard idleTimeoutMinutes={idleTimeoutMinutes} />
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <BrandMark settings={settings} />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao painel
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
          <div className="mt-8 max-w-2xl">
            <Badge>Analytics basico</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              Performance dos links
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Acompanhe total de cliques, links mais acessados e ultimo clique registrado. A tabela de cliques ja guarda
              user agent e referrer para evoluir metricas de origem, dispositivo e navegador.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total de cliques</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                {totalClicks}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Link mais acessado</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                {leader?.title ?? "Sem dados"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Ultimo clique geral</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                {formatDateTime(
                  links
                    .map((item) => item.last_clicked_at)
                    .filter(Boolean)
                    .sort()
                    .at(-1) ?? null
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de acessos</CardTitle>
            <CardDescription>Ordenado por total de cliques registrados em cada link.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankedLinks.map((item, index) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-[auto_1fr_auto] dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white dark:bg-sky-400 dark:text-slate-950">
                    {index + 1}
                  </div>
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-300">
                      <LinkIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-black text-slate-950 dark:text-slate-50">{item.title}</h2>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{item.url}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge>{getCategoryLabel(item.category)}</Badge>
                        {!item.is_active && (
                          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-blue-700 dark:text-sky-300">{item.click_count}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Ultimo: {formatDateTime(item.last_clicked_at)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
