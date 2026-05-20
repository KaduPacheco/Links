import { KeyRound } from "lucide-react";
import { AdminAcceptInviteForm } from "@/components/admin-accept-invite-form";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/site-settings";

type InvitePageProps = {
  params: {
    token: string;
  };
};

export default async function InvitePage({ params }: InvitePageProps) {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader className="space-y-5">
          <BrandMark settings={settings} />
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Criar senha de acesso
            </CardTitle>
            <CardDescription>Defina sua senha para ativar o convite do painel administrativo.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AdminAcceptInviteForm token={params.token} />
        </CardContent>
      </Card>
    </main>
  );
}
