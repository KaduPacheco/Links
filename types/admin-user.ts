export const adminRoles = ["owner", "admin", "editor"] as const;
export const adminUserStatuses = ["pending", "active", "inactive"] as const;

export type AdminRole = (typeof adminRoles)[number];
export type AdminUserStatus = (typeof adminUserStatuses)[number];

export type AdminUser = {
  id: string;
  account_id: string;
  name: string;
  login: string;
  role: AdminRole;
  status: AdminUserStatus;
  created_at: string;
  updated_at: string;
  invited_at: string | null;
  accepted_at: string | null;
};

export type AdminInviteResult = {
  user: AdminUser;
  inviteUrl: string;
};
