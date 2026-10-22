"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { authenticate, type AuthActionState } from "@/app/auth/actions";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const buttonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const initialState: AuthActionState = { error: null, message: null };

export function LoginForm({ configured }: { configured: boolean }) {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Email
        <input
          className={fieldClassName}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          className={fieldClassName}
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          maxLength={128}
          required
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm" role="status">
          {state.message}
        </p>
      )}
      {searchParams.get("notice") === "confirmation-error" && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          That confirmation link could not be used. Request a new one or try signing in.
        </p>
      )}

      {!configured && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-muted-foreground">
          Add the Supabase values from <code>apps/web/.env.example</code> to
          <code> apps/web/.env.local</code> before using account access.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className={buttonClassName + " bg-primary text-primary-foreground hover:opacity-85"}
          type="submit"
          name="intent"
          value="sign-in"
          disabled={!configured || isPending}
        >
          {isPending ? "Working…" : "Sign in"}
        </button>
        <button
          className={buttonClassName + " border border-border bg-background hover:bg-muted"}
          type="submit"
          name="intent"
          value="sign-up"
          disabled={!configured || isPending}
        >
          Create account
        </button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Your saved applications are private to your account. You can use the
        same account from another device.
      </p>
    </form>
  );
}
