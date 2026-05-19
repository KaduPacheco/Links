"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BarChart3, Edit3, ExternalLink, GripVertical, Plus, RefreshCw, Trash2 } from "lucide-react";
import { LinkIcon, iconOptions } from "@/components/icon-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, isWhatsAppLink } from "@/lib/utils";
import { categories, type LinkPayload, type LinkWithAnalytics } from "@/types/link";

const emptyForm: LinkPayload = {
  title: "",
  url: "",
  description: "",
  icon: "ExternalLink",
  category: "Comercial",
  lead_message: "",
  is_active: true,
  display_order: 1
};

function redirectToLogin() {
  window.location.assign("/admin/login?next=/admin");
}

async function readJsonOrThrow<T>(response: Response) {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Sessão expirada.");
  }

  return (await response.json()) as T;
}

export function AdminLinkManager() {
  const [links, setLinks] = useState<LinkWithAnalytics[]>([]);
  const [form, setForm] = useState<LinkPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => a.display_order - b.display_order),
    [links]
  );
  const totalClicks = links.reduce((sum, item) => sum + item.click_count, 0);
  const isWhatsAppTarget = isWhatsAppLink(form.url);

  async function loadLinks() {
    const response = await fetch("/api/links", { cache: "no-store" });
    const payload = await readJsonOrThrow<{ data: LinkWithAnalytics[] }>(response);
    setLinks(payload.data ?? []);
  }

  useEffect(() => {
    loadLinks().catch(() => setMessage("Não foi possível carregar os links."));
  }, []);

  function editLink(item: LinkWithAnalytics) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      url: item.url,
      description: item.description ?? "",
      icon: item.icon ?? "ExternalLink",
      category: item.category,
      lead_message: item.lead_message ?? "",
      is_active: item.is_active,
      display_order: item.display_order
    });
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      display_order: Math.max(0, ...links.map((item) => item.display_order)) + 1
    });
  }

  async function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(editingId ? `/api/links/${editingId}` : "/api/links", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await readJsonOrThrow<{ error?: string }>(response);

      if (!response.ok) {
        setMessage(payload.error ?? "Não foi possível salvar o link.");
        return;
      }

      await loadLinks();
      resetForm();
      setMessage("Link salvo com sucesso.");
    });
  }

  async function removeLink(id: string) {
    if (!window.confirm("Excluir este link? Esta ação não pode ser desfeita.")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
      const payload = await readJsonOrThrow<{ error?: string }>(response);

      if (!response.ok) {
        setMessage(payload.error ?? "Não foi possível excluir o link.");
        return;
      }

      await loadLinks();
      setMessage("Link excluído.");
    });
  }

  async function quickUpdate(item: LinkWithAnalytics, updates: Partial<LinkPayload>) {
    startTransition(async () => {
      const response = await fetch(`/api/links/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          url: item.url,
          description: item.description,
          icon: item.icon,
          category: item.category,
          lead_message: item.lead_message,
          is_active: item.is_active,
          display_order: item.display_order,
          ...updates
        })
      });

      const payload = await readJsonOrThrow<{ error?: string }>(response);

      if (!response.ok) {
        setMessage(payload.error ?? "Não foi possível atualizar o link.");
        return;
      }

      await loadLinks();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card className="h-fit border-white/70 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <CardHeader>
          <CardTitle>{editingId ? "Editar link" : "Novo link"}</CardTitle>
          <CardDescription>
            Cadastre canais oficiais, materiais e páginas de conversão da marca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveLink}>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Solicitar demonstração"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(event) => {
                  const nextUrl = event.target.value;
                  setForm((current) => ({
                    ...current,
                    url: nextUrl,
                    lead_message: isWhatsAppLink(nextUrl) ? current.lead_message : ""
                  }));
                }}
                placeholder="https:// ou /caminho"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição curta</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Explique o destino em uma frase."
              />
            </div>

            {isWhatsAppTarget && (
              <div className="space-y-2">
                <Label htmlFor="lead_message">Mensagem automática</Label>
                <Textarea
                  id="lead_message"
                  value={form.lead_message ?? ""}
                  onChange={(event) => setForm({ ...form, lead_message: event.target.value })}
                  placeholder='Ex.: Olá! Vim pelo link "{{origem}}" e quero falar com vocês.'
                />
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Em links do WhatsApp, essa mensagem será preenchida automaticamente. Você pode usar{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{"{{origem}}"}</span> para inserir
                  o título do botão clicado.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as LinkPayload["category"] })
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  id="icon"
                  value={form.icon ?? "ExternalLink"}
                  onChange={(event) => setForm({ ...form, icon: event.target.value })}
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(event) => setForm({ ...form, display_order: Number(event.target.value) })}
                />
              </div>

              <div className="flex items-end gap-3 pb-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  label="Status ativo"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ativo</span>
              </div>
            </div>

            {message && (
              <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-sky-500/10 dark:text-sky-200">
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                <Plus className="h-4 w-4" />
                {editingId ? "Salvar alterações" : "Adicionar link"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total de links</CardDescription>
              <CardTitle>{links.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Cliques registrados</CardDescription>
              <CardTitle>{totalClicks}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Links ativos</CardDescription>
              <CardTitle>{links.filter((item) => item.is_active).length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Links cadastrados</CardTitle>
              <CardDescription>Edite, desative ou altere a prioridade de exibição.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={loadLinks}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Link
                href="/admin/analytics"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedLinks.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-300">
                    <LinkIcon name={item.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950 dark:text-slate-50">{item.title}</h3>
                      <Badge>{item.category}</Badge>
                      {!item.is_active && (
                        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{item.url}</p>
                    {item.description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                    )}
                    {isWhatsAppLink(item.url) && item.lead_message && (
                      <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        Mensagem automática: {item.lead_message}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{item.click_count} cliques</span>
                      <span>Último clique: {formatDateTime(item.last_clicked_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <GripVertical className="h-3.5 w-3.5" /> Ordem {item.display_order}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => quickUpdate(item, { is_active: checked })}
                    label={`Ativar ${item.title}`}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => quickUpdate(item, { display_order: item.display_order - 1 })}
                  >
                    Subir
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => quickUpdate(item, { display_order: item.display_order + 1 })}
                  >
                    Descer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => editLink(item)}>
                    <Edit3 className="h-4 w-4" />
                    Editar
                  </Button>
                  <a
                    href={item.url}
                    target={item.url.startsWith("/") ? "_self" : "_blank"}
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => removeLink(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
