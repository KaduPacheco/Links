export type TenantDashboardOverview = {
  totalLinks: number;
  activeLinks: number;
  inactiveLinks: number;
  totalClicks: number;
  clicksLast7Days: number;
  clicksLast30Days: number;
  lastClickAt: string | null;
  teamMembers: number;
  activeMembers: number;
  pendingInvites: number;
  successfulLoginsLast7Days: number;
  failedLoginsLast7Days: number;
  rateLimitedLoginsLast7Days: number;
  criticalEventsLast24h: number;
};

export type TenantDashboardTrendPoint = {
  date: string;
  label: string;
  clicks: number;
  successfulLogins: number;
  failedLogins: number;
};

export type TenantDashboardTopLink = {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
  clickCount: number;
  lastClickedAt: string | null;
};

export type TenantDashboardCategoryMetric = {
  category: string;
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
};

export type TenantDashboardAlert = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
};

export type TenantDashboardData = {
  generatedAt: string;
  overview: TenantDashboardOverview;
  trends: TenantDashboardTrendPoint[];
  topLinks: TenantDashboardTopLink[];
  categories: TenantDashboardCategoryMetric[];
  alerts: TenantDashboardAlert[];
};
