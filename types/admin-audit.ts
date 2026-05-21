export type AdminAuditEvent = {
  id: string;
  account_id: string | null;
  actor_user_id: string | null;
  actor_login: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AdminAuditPage = {
  data: AdminAuditEvent[];
  nextCursor: string | null;
};

export type AdminAuditAction =
  | "auth.login.succeeded"
  | "auth.login.failed"
  | "auth.login.rate_limited"
  | "auth.logout"
  | "auth.signup.succeeded"
  | "auth.invite.accepted"
  | "auth.account_invite.accepted"
  | "admin.password.updated"
  | "admin.settings.updated"
  | "admin.user.invited"
  | "admin.account.invited"
  | "admin.user.status_updated"
  | "admin.link.created"
  | "admin.link.updated"
  | "admin.link.deleted";

export type AdminAuditTimeRange = "24h" | "7d" | "30d" | "all";
export type AdminAuditSeverity = "critical" | "warning" | "info";

export type AdminAuditFilters = {
  action: AdminAuditAction | "all";
  actor: string;
  timeRange: AdminAuditTimeRange;
};

export const adminAuditActionOptions: Array<{ value: AdminAuditAction | "all"; label: string }> = [
  { value: "all", label: "Todas as acoes" },
  { value: "auth.login.succeeded", label: "Login realizado" },
  { value: "auth.login.failed", label: "Login falhou" },
  { value: "auth.login.rate_limited", label: "Login bloqueado" },
  { value: "auth.logout", label: "Logout" },
  { value: "auth.signup.succeeded", label: "Conta criada" },
  { value: "auth.invite.accepted", label: "Convite aceito" },
  { value: "auth.account_invite.accepted", label: "Convite de empresa aceito" },
  { value: "admin.password.updated", label: "Senha atualizada" },
  { value: "admin.settings.updated", label: "Configuracoes salvas" },
  { value: "admin.user.invited", label: "Usuario convidado" },
  { value: "admin.account.invited", label: "Empresa convidada" },
  { value: "admin.user.status_updated", label: "Status de usuario alterado" },
  { value: "admin.link.created", label: "Link criado" },
  { value: "admin.link.updated", label: "Link atualizado" },
  { value: "admin.link.deleted", label: "Link removido" }
];

export const adminAuditTimeRangeOptions: Array<{ value: AdminAuditTimeRange; label: string }> = [
  { value: "24h", label: "Ultimas 24h" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "all", label: "Todo o periodo" }
];

export const defaultAdminAuditFilters: AdminAuditFilters = {
  action: "all",
  actor: "",
  timeRange: "24h"
};

export function getAdminAuditActionLabel(action: string) {
  return adminAuditActionOptions.find((option) => option.value === action)?.label ?? action;
}

export function getAdminAuditSeverity(action: string): AdminAuditSeverity {
  if (action === "auth.login.failed" || action === "auth.login.rate_limited") {
    return "critical";
  }

  if (
    action === "admin.user.status_updated" ||
    action === "admin.password.updated" ||
    action === "admin.link.deleted"
  ) {
    return "warning";
  }

  return "info";
}
