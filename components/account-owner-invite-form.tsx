"use client";

import { FormEvent, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountOwnerInviteFormProps = {
  token: string;
  companyName: string;
  ownerName: string;
  login: string;
};

type AcceptResponse = {
  error?: string;
  next?: string;
};

export function AccountOwnerInviteForm({ token, companyName, ownerName, login }: AccountOwnerInviteFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/accept-account-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password,
        confirmPassword
      })
    });

    const payload = (await response.json()) as AcceptResponse;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel ativar a nova conta.");
      return;
    }

    router.replace((payload.next ?? "/admin") as Route);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-company">Empresa</Label>
          <Input id="invite-company" value={companyName} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-owner">Responsavel</Label>
          <Input id="invite-owner" value={ownerName} readOnly />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-login">E-mail</Label>
        <Input id="invite-login" value={login} readOnly />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-password">Senha</Label>
          <Input
            id="invite-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-confirm-password">Confirmar senha</Label>
          <Input
            id="invite-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
      </div>

      {message && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta..." : "Ativar nova conta"}
      </Button>
    </form>
  );
}
