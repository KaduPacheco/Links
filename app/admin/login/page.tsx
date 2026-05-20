import { Suspense } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAuthConfigError, isAdminAuthConfigured } from "@/lib/admin-account";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminLoginPage() {
  const [authReady, authError, settings] = await Promise.all([
    isAdminAuthConfigured(),
    getAdminAuthConfigError(),
    getSiteSettings()
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark settings={settings} />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Acesso administrativo
            </CardTitle>
            <CardDescription>Entre para gerenciar links, mensagens automaticas e analytics.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {authReady ? (
            <Suspense fallback={null}>
              <AdminLoginForm />
            </Suspense>
          ) : (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              {authError ?? "Auth admin nao configurada."}
            </p>
          )}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Nova empresa?{" "}
            <Link href="/cadastro" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
