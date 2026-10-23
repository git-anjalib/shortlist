"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message: string | null;
  canResendConfirmation?: boolean;
};

type AuthIntent = "sign-in" | "sign-up" | "resend-confirmation";

type AuthErrorDetails = {
  code?: string;
  status?: number;
};

function getAuthErrorMessage(error: AuthErrorDetails, intent: AuthIntent) {
  const code = error.code?.toLowerCase();

  switch (code) {
    case "signup_disabled":
      return "New account creation is disabled in Supabase. Enable “Allow new users to sign up” under Authentication → Sign In / Providers.";
    case "email_provider_disabled":
      return "Email sign-in is disabled in Supabase. Enable the Email provider under Authentication → Sign In / Providers.";
    case "email_address_invalid":
      return "Supabase rejected this email address. Check it and try again.";
    case "weak_password":
      return "This password does not meet the password strength requirements. Choose a longer, less common password.";
    case "email_exists":
    case "user_already_exists":
      return "An account may already exist for this email. Try signing in, or request another confirmation link below.";
    case "email_not_confirmed":
      return "This account's email is not confirmed yet. Use the confirmation link, or request another below.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Supabase temporarily limited authentication attempts. Wait a little before trying again.";
    case "email_address_not_authorized":
      return "Supabase is currently allowing email only to approved addresses. Check the project's email provider settings.";
    case "invalid_credentials":
      return "Sign in failed. Check your email and password, then try again.";
    default: {
      const label =
        intent === "sign-in"
          ? "Sign in"
          : intent === "resend-confirmation"
            ? "Sending the confirmation email"
            : "Account creation";
      const diagnostic =
        code && /^[a-z0-9_]+$/.test(code)
          ? code
          : typeof error.status === "number"
            ? "HTTP_" + error.status
            : null;

      return (
        label +
        " failed" +
        (diagnostic ? " (Supabase code: " + diagnostic + ")" : "") +
        ". Try again. If it keeps failing, share the code shown here."
      );
    }
  }
}

function canResendAfterError(error: AuthErrorDetails) {
  return ["email_exists", "user_already_exists", "email_not_confirmed"].includes(
    error.code?.toLowerCase() ?? "",
  );
}

export async function authenticate(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    intent !== "sign-in" &&
    intent !== "sign-up" &&
    intent !== "resend-confirmation"
  ) {
    return { error: "Choose sign in or create account.", message: null };
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address.", message: null };
  }

  if (
    intent !== "resend-confirmation" &&
    (password.length < 8 || password.length > 128)
  ) {
    return { error: "Use a password with at least 8 characters.", message: null };
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      error: "Connect your Supabase project before signing in.",
      message: null,
    };
  }

  if (intent === "sign-in") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        error: getAuthErrorMessage(error, intent),
        message: null,
        canResendConfirmation: error.code === "email_not_confirmed",
      };
    }

    redirect("/");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  let emailRedirectTo: string;
  try {
    emailRedirectTo = new URL("/auth/callback?next=%2F", siteUrl).toString();
  } catch {
    return {
      error: "Set a valid NEXT_PUBLIC_SITE_URL before creating an account.",
      message: null,
    };
  }

  if (intent === "resend-confirmation") {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (error) {
      return {
        error: getAuthErrorMessage(error, intent),
        message: null,
        canResendConfirmation: true,
      };
    }

    return {
      error: null,
      message:
        "If a confirmation email can be sent to this address, it should arrive shortly. Check your inbox and spam folder.",
      canResendConfirmation: true,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error, intent),
      message: null,
      canResendConfirmation: canResendAfterError(error),
    };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    error: null,
    message:
      "If this email can be used to create or confirm an account, Supabase will send a link. Check your inbox and spam folder. If you already have an account, switch to Sign in.",
    canResendConfirmation: true,
  };
}

export async function signOutAction(_formData: FormData) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
