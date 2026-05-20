"use client";

import { useState } from "react";
import { Link2, Settings2 } from "lucide-react";
import { AdminLinkManager } from "@/components/admin-link-manager";
import { AdminSettingsManager } from "@/components/admin-settings-manager";
import { Button } from "@/components/ui/button";
import { type SiteSettings } from "@/types/site-settings";

type AdminWorkspaceProps = {
  initialSettings: SiteSettings;
  initialAccount: {
    login: string | null;
    credentialSource: "database" | "environment" | null;
  };
};

export function AdminWorkspace({ initialSettings, initialAccount }: AdminWorkspaceProps) {
  const [tab, setTab] = useState<"links" | "settings">("links");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
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
      </div>

      {tab === "links" ? (
        <AdminLinkManager />
      ) : (
        <AdminSettingsManager initialSettings={initialSettings} initialAccount={initialAccount} />
      )}
    </section>
  );
}
