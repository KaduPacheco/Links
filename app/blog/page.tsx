import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export default function BlogPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-panel max-w-2xl rounded-[2rem] p-8 text-center">
        <BrandMark className="justify-center" />
        <Newspaper className="mx-auto mt-8 h-12 w-12 text-blue-600" />
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Blog Ponto Eletrônico</h1>
        <p className="mt-3 text-slate-600">
          Espaço preparado para artigos sobre jornada, ponto online, compliance trabalhista e gestão de equipes.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos links
        </Link>
      </section>
    </main>
  );
}
