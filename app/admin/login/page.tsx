import { LockKeyhole } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminAuthConfigured, getAdminAuthConfigError } from "@/lib/auth";

export default function AdminLoginPage() {
  const authReady = isAdminAuthConfigured();
  const authError = getAdminAuthConfigError();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Acesso administrativo
            </CardTitle>
            <CardDescription>Entre para gerenciar links, mensagens automáticas e analytics.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {authReady ? (
            <AdminLoginForm />
          ) : (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              {authError ?? "Auth admin não configurada."}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
