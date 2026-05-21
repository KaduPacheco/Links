"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, KeyRound, Save, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type AdminSettingsManagerProps = {
  initialSettings: SiteSettings;
  initialAccount: {
    login: string | null;
    credentialSource: "database" | "environment" | null;
  };
};

type PasswordForm = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordForm = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: ""
};

function redirectToLogin() {
  window.location.assign("/admin/login?next=/admin");
}

async function readJsonOrThrow<T>(response: Response) {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Sessao expirada.");
  }

  return (await response.json()) as T;
}

export function AdminSettingsManager({ initialSettings, initialAccount }: AdminSettingsManagerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings>(initialSettings ?? defaultSiteSettings);
  const [account, setAccount] = useState(initialAccount);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isSavingSettings, startSavingSettings] = useTransition();
  const [isSavingPassword, startSavingPassword] = useTransition();

  function updateField<Key extends keyof SiteSettings>(field: Key, value: SiteSettings[Key]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsMessage(null);

    startSavingSettings(async () => {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      const payload = await readJsonOrThrow<{ error?: string; data?: SiteSettings }>(response);

      if (!response.ok || !payload.data) {
        setSettingsMessage(payload.error ?? "Nao foi possivel salvar as configuracoes.");
        return;
      }

      setSettings(payload.data);
      setSettingsMessage("Configuracoes salvas com sucesso.");
      router.refresh();
    });
  }

  async function handleSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    startSavingPassword(async () => {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      });

      const payload = await readJsonOrThrow<{
        error?: string;
        account?: { login: string | null; credentialSource: "database" | "environment" | null };
        next?: string;
        requiresReauth?: boolean;
      }>(response);

      if (!response.ok) {
        setPasswordMessage(payload.error ?? "Nao foi possivel atualizar a senha.");
        return;
      }

      if (payload.account) {
        setAccount(payload.account);
      }

      setPasswordForm(emptyPasswordForm);

      if (payload.requiresReauth) {
        setPasswordMessage("Senha atualizada. Entre novamente para continuar.");
        window.setTimeout(() => {
          window.location.assign(payload.next ?? "/admin/login?next=/admin");
        }, 800);
        return;
      }

      setPasswordMessage("Senha atualizada com sucesso.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card className="border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Marca e textos
            </CardTitle>
            <CardDescription>Atualize o nome da empresa, a logo e as frases exibidas na pagina publica.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSaveSettings}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da empresa</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(event) => updateField("company_name", event.target.value)}
                    placeholder="Minha empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_label">Rotulo da marca</Label>
                  <Input
                    id="brand_label"
                    value={settings.brand_label}
                    onChange={(event) => updateField("brand_label", event.target.value)}
                    placeholder="Links oficiais"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo_url">Logo da empresa</Label>
                <Input
                  id="company_logo_url"
                  value={settings.company_logo_url ?? ""}
                  onChange={(event) => updateField("company_logo_url", event.target.value || null)}
                  placeholder="https://... ou /logo.png"
                />
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Use uma URL publica ou um caminho interno do projeto. Se deixar em branco, o icone padrao continua.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_badge">Frase de destaque</Label>
                <Input
                  id="hero_badge"
                  value={settings.hero_badge}
                  onChange={(event) => updateField("hero_badge", event.target.value)}
                  placeholder="Controle de jornada simples, seguro e inteligente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_description">Descricao principal</Label>
                <Textarea
                  id="hero_description"
                  value={settings.hero_description}
                  onChange={(event) => updateField("hero_description", event.target.value)}
                  placeholder="Explique o que a empresa oferece."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="links_heading">Titulo da secao de links</Label>
                  <Input
                    id="links_heading"
                    value={settings.links_heading}
                    onChange={(event) => updateField("links_heading", event.target.value)}
                    placeholder="Links oficiais"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="links_description">Descricao da secao de links</Label>
                  <Textarea
                    id="links_description"
                    value={settings.links_description}
                    onChange={(event) => updateField("links_description", event.target.value)}
                    placeholder="Oriente o visitante sobre os canais disponiveis."
                    required
                  />
                </div>
              </div>

              {settingsMessage && (
                <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                  {settingsMessage}
                </p>
              )}

              <Button type="submit" disabled={isSavingSettings}>
                <Save className="h-4 w-4" />
                {isSavingSettings ? "Salvando..." : "Salvar configuracoes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Seguranca
            </CardTitle>
            <CardDescription>Troque a senha de acesso do painel administrativo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSavePassword}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nextPassword">Nova senha</Label>
                  <Input
                    id="nextPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.nextPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              {passwordMessage && (
                <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                  {passwordMessage}
                </p>
              )}

              <Button type="submit" disabled={isSavingPassword}>
                <KeyRound className="h-4 w-4" />
                {isSavingPassword ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              Preview rapido
            </CardTitle>
            <CardDescription>Como a identidade principal aparece no topo da pagina publica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  {settings.company_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.company_logo_url} alt={settings.company_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black">{settings.company_name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-950 dark:text-slate-50">{settings.company_name}</p>
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-sky-300">
                    {settings.brand_label}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Badge>{settings.hero_badge}</Badge>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{settings.hero_description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
          <CardHeader>
            <CardTitle>Acesso atual</CardTitle>
            <CardDescription>Resumo rapido da credencial administrativa em uso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Login</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{account.login ?? "Nao definido"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Origem</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {account.credentialSource === "database"
                  ? "Banco de dados"
                  : account.credentialSource === "environment"
                    ? "Variaveis de ambiente"
                    : "Nao configurada"}
              </p>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Contas baseadas no banco podem trocar a senha por aqui. Credenciais vindas de variaveis de ambiente devem
              ser rotacionadas fora do painel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
