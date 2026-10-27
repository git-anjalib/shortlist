"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { authenticate, type AuthActionState } from "@/app/auth/actions";
import {
  validateAuthCredentials,
  type AuthFieldErrors,
  type AuthIntent,
} from "@/lib/auth-validation";

const fieldClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const buttonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const initialState: AuthActionState = {
  error: null,
  message: null,
  canResendConfirmation: false,
};

export function LoginForm({ configured }: { configured: boolean }) {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<AuthFieldErrors>({});
  const canResendConfirmation =
    state.canResendConfirmation ||
    searchParams.get("notice") === "confirmation-error";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter;
    const submitterValue =
      submitter instanceof HTMLButtonElement ? submitter.value : "sign-in";
    const intent: AuthIntent =
      submitterValue === "sign-up" || submitterValue === "resend-confirmation"
        ? submitterValue
        : "sign-in";

    setClientErrors({});

    if (intent === "resend-confirmation") {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const errors = validateAuthCredentials({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      intent,
    });

    setClientErrors(errors);
    if (errors.email || errors.password) {
      event.preventDefault();
    }
  }

  function clearClientError(field: keyof AuthFieldErrors) {
    setClientErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  const emailError = clientErrors.email;
  const passwordError = clientErrors.password;
  const showActionError = !emailError && !passwordError && state.error;

  return (
    <form
      action={formAction}
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="auth-email">
          Email
        </label>
        <input
          aria-describedby={emailError ? "auth-email-error" : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          className={fieldClassName}
          id="auth-email"
          required
          maxLength={254}
          name="email"
          onChange={() => clearClientError("email")}
          type="email"
        />
        {emailError && (
          <p
            className="mt-1 text-sm text-destructive"
            id="auth-email-error"
            role="alert"
          >
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="auth-password">
          Password
        </label>
        <input
          aria-describedby={
            passwordError
              ? "auth-password-hint auth-password-error"
              : "auth-password-hint"
          }
          aria-invalid={Boolean(passwordError)}
          autoComplete="current-password"
          className={fieldClassName}
          id="auth-password"
          required
          maxLength={128}
          minLength={8}
          name="password"
          onChange={() => clearClientError("password")}
          type="password"
        />
        <p
          className="mt-1.5 text-xs leading-5 text-muted-foreground"
          id="auth-password-hint"
        >
          Use 8–128 characters. Passwords are case-sensitive; Supabase may also
          reject common or weak passwords.
        </p>
        {passwordError && (
          <p
            className="mt-1 text-sm text-destructive"
            id="auth-password-error"
            role="alert"
          >
            {passwordError}
          </p>
        )}
      </div>

      {showActionError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {showActionError}
        </p>
      )}
      {state.message && (
        <p
          className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
          role="status"
        >
          {state.message}
        </p>
      )}
      {searchParams.get("notice") === "confirmation-error" && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
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

      {canResendConfirmation && (
        <button
          className={buttonClassName + " border border-border bg-background hover:bg-muted"}
          type="submit"
          name="intent"
          value="resend-confirmation"
          formNoValidate
          disabled={!configured || isPending}
        >
          Resend confirmation email
        </button>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        Your saved applications are private to your account. You can use the
        same account from another device.
      </p>
    </form>
  );
}
