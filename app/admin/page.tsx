import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminLinkManager } from "@/components/admin-link-manager";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <BrandMark />
            <div>
              <Badge>
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Preparado para Supabase Auth
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                Painel administrativo
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                Gerencie links, prioridades, status e acompanhe performance basica em uma interface direta.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver pagina publica
          </Link>
        </header>

        <AdminLinkManager />
      </div>
    </main>
  );
}
