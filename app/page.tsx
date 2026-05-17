import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LinkIcon } from "@/components/icon-picker";
import { Badge } from "@/components/ui/badge";
import { getLinksWithAnalytics } from "@/lib/links";

function groupByCategory<T extends { category: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export default async function HomePage() {
  const links = await getLinksWithAnalytics(false);
  const groupedLinks = groupByCategory(links);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-300/25 blur-3xl dark:bg-sky-500/20" />
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="animate-fade-up space-y-8">
          <BrandMark />
          <div className="max-w-2xl space-y-5">
            <Badge>Controle de jornada simples, seguro e inteligente</Badge>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-6xl">
              Ponto Eletronico
            </h1>
            <p className="text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
              Sistema inteligente para controle de jornada, ponto online e gestao de equipes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Implantacao rapida", Zap],
              ["Dados protegidos", ShieldCheck],
              ["Gestao em tempo real", BarChart3]
            ].map(([label, Icon]) => (
              <div key={String(label)} className="glass-panel rounded-2xl p-4">
                <Icon className="mb-3 h-5 w-5 text-blue-600 dark:text-sky-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{String(label)}</p>
              </div>
            ))}
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
          >
            Acessar painel administrativo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <section className="glass-panel animate-fade-up rounded-[2rem] p-4 shadow-glow sm:p-6">
          <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/70">
            <div className="mb-6 flex items-center justify-between">
              <BrandMark compact />
              <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Online
              </Badge>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Links oficiais</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Escolha o canal ideal para conhecer o sistema, falar com o time ou acessar materiais.
              </p>
            </div>

            <div className="space-y-5">
              {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
                <div key={category} className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-sky-300">
                    {category}
                  </p>
                  {categoryLinks.map((item) => (
                    <a
                      key={item.id}
                      href={`/api/click?linkId=${item.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-sky-500/40 dark:hover:shadow-black/30"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-sky-300 dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950">
                        <LinkIcon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-black text-slate-950 dark:text-slate-50">{item.title}</span>
                        {item.description && (
                          <span className="mt-1 block text-sm leading-5 text-slate-500 dark:text-slate-400">
                            {item.description}
                          </span>
                        )}
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-sky-300" />
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
