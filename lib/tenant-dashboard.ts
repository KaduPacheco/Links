import { unstable_noStore as noStore } from "next/cache";
import { getPool } from "@/lib/db";
import { listAdminUsers } from "@/lib/admin-account";
import { getLinksWithAnalytics } from "@/lib/links";
import { logger } from "@/lib/logger";
import { seedLinks } from "@/lib/seed-links";
import type { TenantDashboardAlert, TenantDashboardCategoryMetric, TenantDashboardData, TenantDashboardOverview, TenantDashboardTopLink, TenantDashboardTrendPoint } from "@/types/tenant-dashboard";

type ClickSummaryRow = {
  total_clicks: string;
  clicks_last_7_days: string;
  clicks_last_30_days: string;
  last_click_at: string | null;
};

type LoginSummaryRow = {
  successful_logins_last_7_days: string;
  failed_logins_last_7_days: string;
  rate_limited_logins_last_7_days: string;
  critical_events_last_24h: string;
};

type TrendRow = {
  date: string;
  clicks: string;
  successful_logins: string;
  failed_logins: string;
};

function formatTrendLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${date}T00:00:00Z`));
}

function createAlerts(overview: TenantDashboardOverview): TenantDashboardAlert[] {
  const alerts: TenantDashboardAlert[] = [];

  if (overview.criticalEventsLast24h > 0) {
    alerts.push({
      id: "critical-events",
      title: "Eventos críticos recentes",
      description: `${overview.criticalEventsLast24h} evento(s) crítico(s) nas últimas 24h. Revise falhas e bloqueios de login.`,
      severity: "critical"
    });
  }

  if (overview.pendingInvites > 0) {
    alerts.push({
      id: "pending-invites",
      title: "Convites pendentes",
      description: `${overview.pendingInvites} convite(s) ainda aguardando aceite.`,
      severity: "warning"
    });
  }

  if (overview.activeLinks === 0) {
    alerts.push({
      id: "no-active-links",
      title: "Nenhum link ativo",
      description: "A conta não possui links ativos no momento.",
      severity: "warning"
    });
  }

  if (overview.totalClicks === 0) {
    alerts.push({
      id: "no-clicks",
      title: "Sem atividade de clique",
      description: "Ainda não houve cliques registrados nesta conta.",
      severity: "info"
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "healthy",
      title: "Conta operando normalmente",
      description: "Não há sinais relevantes de risco ou fricção no momento.",
      severity: "info"
    });
  }

  return alerts;
}

function buildFallbackDashboard(): TenantDashboardData {
  const totalLinks = seedLinks.length;
  const activeLinks = seedLinks.filter((link) => link.is_active).length;
  const categoriesMap = new Map<string, TenantDashboardCategoryMetric>();

  for (const link of seedLinks) {
    const current = categoriesMap.get(link.category) ?? {
      category: link.category,
      totalLinks: 0,
      activeLinks: 0,
      totalClicks: 0
    };

    current.totalLinks += 1;
    current.activeLinks += link.is_active ? 1 : 0;
    categoriesMap.set(link.category, current);
  }

  const overview: TenantDashboardOverview = {
    totalLinks,
    activeLinks,
    inactiveLinks: totalLinks - activeLinks,
    totalClicks: 0,
    clicksLast7Days: 0,
    clicksLast30Days: 0,
    lastClickAt: null,
    teamMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    successfulLoginsLast7Days: 0,
    failedLoginsLast7Days: 0,
    rateLimitedLoginsLast7Days: 0,
    criticalEventsLast24h: 0
  };

  return {
    generatedAt: new Date().toISOString(),
    overview,
    trends: [],
    topLinks: seedLinks
      .slice(0, 5)
      .map<TenantDashboardTopLink>((link) => ({
        id: link.id,
        title: link.title,
        category: link.category,
        isActive: link.is_active,
        clickCount: link.click_count,
        lastClickedAt: link.last_clicked_at
      })),
    categories: [...categoriesMap.values()],
    alerts: createAlerts(overview)
  };
}

export async function getTenantDashboard(accountId: string): Promise<TenantDashboardData> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return buildFallbackDashboard();
  }

  try {
    const [links, users, clickSummaryResult, loginSummaryResult, trendResult] = await Promise.all([
      getLinksWithAnalytics(true, accountId),
      listAdminUsers(accountId),
      pool.query<ClickSummaryRow>(
        `
          select
            count(*)::text as total_clicks,
            count(*) filter (where clicked_at >= now() - interval '7 days')::text as clicks_last_7_days,
            count(*) filter (where clicked_at >= now() - interval '30 days')::text as clicks_last_30_days,
            max(clicked_at)::text as last_click_at
          from link_clicks
          where account_id = $1
        `,
        [accountId]
      ),
      pool.query<LoginSummaryRow>(
        `
          select
            count(*) filter (where action = 'auth.login.succeeded' and created_at >= now() - interval '7 days')::text as successful_logins_last_7_days,
            count(*) filter (where action = 'auth.login.failed' and created_at >= now() - interval '7 days')::text as failed_logins_last_7_days,
            count(*) filter (where action = 'auth.login.rate_limited' and created_at >= now() - interval '7 days')::text as rate_limited_logins_last_7_days,
            count(*) filter (where action in ('auth.login.failed', 'auth.login.rate_limited') and created_at >= now() - interval '24 hours')::text as critical_events_last_24h
          from admin_audit_logs
          where account_id = $1
        `,
        [accountId]
      ),
      pool.query<TrendRow>(
        `
          with days as (
            select generate_series(
              current_date - interval '6 days',
              current_date,
              interval '1 day'
            )::date as day
          ),
          click_totals as (
            select date_trunc('day', clicked_at)::date as day, count(*)::integer as clicks
            from link_clicks
            where account_id = $1
              and clicked_at >= current_date - interval '6 days'
            group by 1
          ),
          audit_totals as (
            select
              date_trunc('day', created_at)::date as day,
              count(*) filter (where action = 'auth.login.succeeded')::integer as successful_logins,
              count(*) filter (where action = 'auth.login.failed')::integer as failed_logins
            from admin_audit_logs
            where account_id = $1
              and created_at >= current_date - interval '6 days'
            group by 1
          )
          select
            days.day::text as date,
            coalesce(click_totals.clicks, 0)::text as clicks,
            coalesce(audit_totals.successful_logins, 0)::text as successful_logins,
            coalesce(audit_totals.failed_logins, 0)::text as failed_logins
          from days
          left join click_totals on click_totals.day = days.day
          left join audit_totals on audit_totals.day = days.day
          order by days.day asc
        `,
        [accountId]
      )
    ]);

    const clickSummary = clickSummaryResult.rows[0];
    const loginSummary = loginSummaryResult.rows[0];
    const activeLinks = links.filter((link) => link.is_active).length;
    const activeMembers = users.filter((user) => user.status === "active").length;
    const pendingInvites = users.filter((user) => user.status === "pending").length;
    const topLinks = [...links]
      .sort((left, right) => right.click_count - left.click_count)
      .slice(0, 5)
      .map<TenantDashboardTopLink>((link) => ({
        id: link.id,
        title: link.title,
        category: link.category,
        isActive: link.is_active,
        clickCount: link.click_count,
        lastClickedAt: link.last_clicked_at
      }));

    const categoriesMap = new Map<string, TenantDashboardCategoryMetric>();

    for (const link of links) {
      const current = categoriesMap.get(link.category) ?? {
        category: link.category,
        totalLinks: 0,
        activeLinks: 0,
        totalClicks: 0
      };

      current.totalLinks += 1;
      current.activeLinks += link.is_active ? 1 : 0;
      current.totalClicks += link.click_count;
      categoriesMap.set(link.category, current);
    }

    const overview: TenantDashboardOverview = {
      totalLinks: links.length,
      activeLinks,
      inactiveLinks: links.length - activeLinks,
      totalClicks: Number(clickSummary?.total_clicks ?? 0),
      clicksLast7Days: Number(clickSummary?.clicks_last_7_days ?? 0),
      clicksLast30Days: Number(clickSummary?.clicks_last_30_days ?? 0),
      lastClickAt: clickSummary?.last_click_at ?? null,
      teamMembers: users.length,
      activeMembers,
      pendingInvites,
      successfulLoginsLast7Days: Number(loginSummary?.successful_logins_last_7_days ?? 0),
      failedLoginsLast7Days: Number(loginSummary?.failed_logins_last_7_days ?? 0),
      rateLimitedLoginsLast7Days: Number(loginSummary?.rate_limited_logins_last_7_days ?? 0),
      criticalEventsLast24h: Number(loginSummary?.critical_events_last_24h ?? 0)
    };

    return {
      generatedAt: new Date().toISOString(),
      overview,
      trends: trendResult.rows.map<TenantDashboardTrendPoint>((row) => ({
        date: row.date,
        label: formatTrendLabel(row.date),
        clicks: Number(row.clicks),
        successfulLogins: Number(row.successful_logins),
        failedLogins: Number(row.failed_logins)
      })),
      topLinks,
      categories: [...categoriesMap.values()].sort((left, right) => right.totalClicks - left.totalClicks),
      alerts: createAlerts(overview)
    };
  } catch (error) {
    logger.error("Failed to load tenant dashboard", error, { accountId });
    return buildFallbackDashboard();
  }
}
