"use client";

import { FormEvent, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupResponse = {
  error?: string;
  next?: string;
};

export function AccountSignupForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        ownerName,
        login,
        password,
        confirmPassword
      })
    });

    const payload = (await response.json()) as SignupResponse;
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel criar a conta.");
      return;
    }

    router.replace((payload.next ?? "/admin") as Route);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="companyName">Empresa</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Nome da empresa"
          autoComplete="organization"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName">Seu nome</Label>
        <Input
          id="ownerName"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Nome do administrador"
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupLogin">E-mail</Label>
        <Input
          id="signupLogin"
          type="email"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          placeholder="admin@empresa.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signupPassword">Senha</Label>
          <Input
            id="signupPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupConfirmPassword">Confirmar senha</Label>
          <Input
            id="signupConfirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar conta e entrar"}
      </Button>
    </form>
  );
}
