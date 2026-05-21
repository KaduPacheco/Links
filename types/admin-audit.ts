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
