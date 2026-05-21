export const accountInviteStatuses = ["pending", "accepted", "revoked"] as const;

export type AccountInviteStatus = (typeof accountInviteStatuses)[number];

export type AccountOwnerInvite = {
  id: string;
  inviter_account_id: string | null;
  inviter_user_id: string | null;
  company_name: string;
  owner_name: string;
  login: string;
  status: AccountInviteStatus;
  created_account_id: string | null;
  created_user_id: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountOwnerInviteResult = {
  invite: AccountOwnerInvite;
  inviteUrl: string;
};
