import Link from "next/link";
import type { Route } from "next";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { AdminWorkspace } from "@/components/admin-workspace";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_ACCOUNT_ID, getAccountById } from "@/lib/accounts";
import { ADMIN_SESSION_COOKIE, getAdminIdleTimeoutMinutes, verifySessionToken } from "@/lib/auth";
import { getAdminAccountInfo, listAdminUsers } from "@/lib/admin-account";
import { getSiteSettingsForAccount } from "@/lib/site-settings";
import type { AdminRole } from "@/types/admin-user";

function normalizeRole(role: string | undefined): AdminRole {
  return role === "admin" || role === "editor" || role === "owner" ? role : "owner";
}

export default async function AdminPage() {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  const currentRole = normalizeRole(session?.role);
  const accountId = session?.account_id ?? DEFAULT_ACCOUNT_ID;
  const idleTimeoutMinutes = getAdminIdleTimeoutMinutes();
  const [settings, account, users, currentAccount] = await Promise.all([
    getSiteSettingsForAccount(accountId),
    getAdminAccountInfo(session?.user_id, accountId),
    listAdminUsers(accountId),
    getAccountById(accountId)
  ]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <AdminSessionGuard idleTimeoutMinutes={idleTimeoutMinutes} />
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <BrandMark settings={settings} />
            <div>
              <Badge>
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Painel protegido por sessao
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                Painel administrativo
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                Gerencie links, prioridades, status, branding e credenciais em uma interface direta.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Ver pagina publica
            </Link>
            {currentAccount?.slug && currentAccount.slug !== "default" && (
              <Link
                href={`/${currentAccount.slug}` as Route}
                className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Ver pagina da conta
              </Link>
            )}
            <AdminLogoutButton />
          </div>
        </header>

        <AdminWorkspace
          initialSettings={settings}
          initialAccount={account}
          initialUsers={users}
          currentRole={currentRole}
        />
      </div>
    </main>
  );
}
