import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
          Loading account access…
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

async function LoginPageContent() {
  const configured = getSupabasePublicConfig() !== null;

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      redirect("/");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <a href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">shortlist</span>
        </a>
        <h1 className="mt-7 text-2xl font-semibold tracking-tight">
          Your job search, in one place.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to keep your applications available across your devices, or
          create an account to get started.
        </p>
        <div className="mt-6">
          <LoginForm configured={configured} />
        </div>
      </section>
    </main>
  );
}
