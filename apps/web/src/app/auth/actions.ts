"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message: string | null;
};

export async function authenticate(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (intent !== "sign-in" && intent !== "sign-up") {
    return { error: "Choose sign in or create account.", message: null };
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address.", message: null };
  }

  if (password.length < 8 || password.length > 128) {
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
        error: "Sign in failed. Check your email and password, then try again.",
        message: null,
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    return {
      error: "Account creation failed. Check your details and try again.",
      message: null,
    };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    error: null,
    message: "Check your email for a confirmation link to finish creating your account.",
  };
}

export async function signOutAction(_formData: FormData) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
