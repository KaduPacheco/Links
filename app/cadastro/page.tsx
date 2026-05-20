import Link from "next/link";
import { Building2 } from "lucide-react";
import { AccountSignupForm } from "@/components/account-signup-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AccountSignupPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark settings={settings} />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Criar conta
            </CardTitle>
            <CardDescription>Cadastre a empresa e entre como administrador principal do painel.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <AccountSignupForm />
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Ja tem acesso?{" "}
            <Link href="/admin/login" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300">
              Entrar no painel
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
