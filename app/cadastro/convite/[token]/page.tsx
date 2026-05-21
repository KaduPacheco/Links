import Link from "next/link";
import { Building2 } from "lucide-react";
import { AccountOwnerInviteForm } from "@/components/account-owner-invite-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingAccountOwnerInvite } from "@/lib/admin-account";
import { getSiteSettings } from "@/lib/site-settings";

type AccountInvitePageProps = {
  params: {
    token: string;
  };
};

export default async function AccountInvitePage({ params }: AccountInvitePageProps) {
  const [settings, invite] = await Promise.all([getSiteSettings(), getPendingAccountOwnerInvite(params.token)]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark settings={settings} />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Criar conta por convite
            </CardTitle>
            <CardDescription>
              {invite
                ? "Defina a senha inicial para ativar sua empresa em uma conta separada."
                : "Este convite nao esta mais disponivel. Solicite um novo link ao responsavel pelo onboarding."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {invite ? (
            <AccountOwnerInviteForm
              token={params.token}
              companyName={invite.company_name}
              ownerName={invite.owner_name}
              login={invite.login}
            />
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              Link invalido, expirado ou ja utilizado.
            </div>
          )}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Ja possui acesso?{" "}
            <Link href="/admin/login" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300">
              Entrar no painel
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
