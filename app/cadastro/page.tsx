import Link from "next/link";
import { Building2, KeyRound } from "lucide-react";
import { AccountSignupForm } from "@/components/account-signup-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAccountSignupDisabledMessage, isPublicAccountSignupEnabled } from "@/lib/admin-account";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AccountSignupPage() {
  const settings = await getSiteSettings();
  const publicSignupEnabled = isPublicAccountSignupEnabled();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark settings={settings} />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              {publicSignupEnabled ? (
                <>
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                  Criar conta
                </>
              ) : (
                <>
                  <KeyRound className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                  Acesso por convite
                </>
              )}
            </CardTitle>
            <CardDescription>
              {publicSignupEnabled
                ? "Cadastre a empresa e entre como administrador principal do painel."
                : getPublicAccountSignupDisabledMessage()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {publicSignupEnabled ? (
            <AccountSignupForm />
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
              O dono da conta pode gerar um link de convite dentro do painel e enviar para a pessoa concluir o cadastro
              com senha própria.
            </div>
          )}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Já recebeu seu acesso?{" "}
            <Link href="/admin/login" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300">
              Entrar no painel
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
