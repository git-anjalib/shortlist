import {
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Applications", href: "#applications", icon: Briefcase },
  { label: "Find jobs", href: "#job-matches", icon: Search },
  { label: "Resume coach", href: "#resume-review", icon: FileText },
];

export function AppSidebar({ email }: { email: string }) {
  const initials = email.slice(0, 1).toUpperCase() || "U";

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground md:flex">
        <a
          href="#overview"
          className="flex items-center gap-3 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"
          >
            <Briefcase className="size-4" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">
              shortlist
            </span>
            <span className="block text-xs text-muted-foreground">
              Job search workspace
            </span>
          </span>
        </a>

        <div className="mt-10">
          <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <nav aria-label="Workspace navigation" className="mt-3">
            <ul className="space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={index === 0 ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        index === 0
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-sidebar-border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings aria-hidden="true" className="size-4 text-muted-foreground" />
              Personalize matches
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Add target roles and locations to shape your job feed.
            </p>
            <a
              href="#profile-criteria"
              className="mt-3 inline-flex items-center text-xs font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Set your criteria
            </a>
          </div>

          <div className="flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            >
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Signed in</span>
              <span className="block truncate text-sm font-medium">{email}</span>
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <a
            href="#overview"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"
            >
              <Briefcase className="size-3.5" />
            </span>
            shortlist
          </a>
          <div className="flex items-center gap-2">
            <span
              aria-label={email}
              className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            >
              {initials}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Workspace navigation" className="overflow-x-auto px-3 pb-2">
          <ul className="flex min-w-max items-center gap-1">
            {navigation.map((item, index) => {
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={index === 0 ? "page" : undefined}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      index === 0
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
