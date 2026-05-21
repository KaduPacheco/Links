"use client";

import { useState } from "react";
import { Activity, LayoutDashboard, Link2, Settings2, UsersRound } from "lucide-react";
import { AdminAuditLog } from "@/components/admin-audit-log";
import { AdminLinkManager } from "@/components/admin-link-manager";
import { AdminSettingsManager } from "@/components/admin-settings-manager";
import { AdminTenantDashboard } from "@/components/admin-tenant-dashboard";
import { AdminUserManager } from "@/components/admin-user-manager";
import { Button } from "@/components/ui/button";
import { type AdminAuditPage } from "@/types/admin-audit";
import { type AdminRole, type AdminUser } from "@/types/admin-user";
import { type SiteSettings } from "@/types/site-settings";
import { type TenantDashboardData } from "@/types/tenant-dashboard";

type AdminWorkspaceProps = {
  initialSettings: SiteSettings;
  initialAccount: {
    login: string | null;
    credentialSource: "database" | "environment" | null;
  };
  initialUsers: AdminUser[];
  initialAuditPage: AdminAuditPage;
  initialTenantDashboard: TenantDashboardData;
  currentRole: AdminRole;
};

export function AdminWorkspace({
  initialSettings,
  initialAccount,
  initialUsers,
  initialAuditPage,
  initialTenantDashboard,
  currentRole
}: AdminWorkspaceProps) {
  const [tab, setTab] = useState<"dashboard" | "links" | "users" | "settings" | "audit">("dashboard");
  const canViewAudit = currentRole !== "editor";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "dashboard" ? "default" : "secondary"} onClick={() => setTab("dashboard")}>
          <LayoutDashboard className="h-4 w-4" />
          SaaS
        </Button>
        <Button type="button" variant={tab === "links" ? "default" : "secondary"} onClick={() => setTab("links")}>
          <Link2 className="h-4 w-4" />
          Links
        </Button>
        <Button
          type="button"
          variant={tab === "settings" ? "default" : "secondary"}
          onClick={() => setTab("settings")}
        >
          <Settings2 className="h-4 w-4" />
          Configuracoes
        </Button>
        <Button type="button" variant={tab === "users" ? "default" : "secondary"} onClick={() => setTab("users")}>
          <UsersRound className="h-4 w-4" />
          Usuarios
        </Button>
        {canViewAudit && (
          <Button type="button" variant={tab === "audit" ? "default" : "secondary"} onClick={() => setTab("audit")}>
            <Activity className="h-4 w-4" />
            Auditoria
          </Button>
        )}
      </div>

      {tab === "dashboard" && <AdminTenantDashboard initialData={initialTenantDashboard} />}
      {tab === "links" && (
        <AdminLinkManager />
      )}
      {tab === "settings" && (
        <AdminSettingsManager initialSettings={initialSettings} initialAccount={initialAccount} />
      )}
      {tab === "users" && <AdminUserManager initialUsers={initialUsers} currentRole={currentRole} />}
      {tab === "audit" && canViewAudit && <AdminAuditLog initialPage={initialAuditPage} />}
    </section>
  );
}
