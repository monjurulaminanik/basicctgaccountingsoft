"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpenText,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/entry", label: "নতুন এন্ট্রি", icon: PlusCircle },
  { href: "/parties", label: "পার্টি", icon: Users },
  { href: "/ledger", label: "লেজার", icon: BookOpenText },
  { href: "/reports", label: "রিপোর্ট", icon: BarChart3 },
  { href: "/settings", label: "সেটিংস", icon: Settings },
];

const mobileNav = nav.slice(0, 4);

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operator",
  VIEWER: "Viewer",
};

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2.5")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-700 text-base font-bold text-white shadow-lg shadow-indigo-900/30">
        P
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">Party Accounts</span>
        <span className="block truncate text-[11px] text-slate-400">Payable &amp; Receivable</span>
      </span>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="প্রধান মেনু">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
              aria-hidden
            />
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300"
              )}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountCard({
  name,
  role,
  onSignOut,
}: {
  name: string;
  role: string;
  onSignOut: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-500/90 text-sm font-semibold text-white">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-white">{name}</span>
        <span className="block truncate text-[11px] text-slate-400">{roleLabel[role] || role}</span>
      </span>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="সাইন আউট"
        title="সাইন আউট"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("ব্যবহারকারী");
  const [role, setRole] = useState("ADMIN");
  const [company, setCompany] = useState("Party Accounts");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x) => {
        setName(x.user.name);
        setRole(x.user.role);
      })
      .catch(() => router.replace("/login"));
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.settings?.companyName) setCompany(d.settings.companyName);
      })
      .catch(() => {});
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 px-3 pb-6 pt-5 lg:flex print:hidden">
        <div className="px-2 pb-6">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-3 px-1 pt-6">
          <AccountCard name={name} role={role} onSignOut={logout} />
          <p className="px-1 text-[10px] text-slate-600">Dawat IT &amp; Consultancy</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="px-3 pb-6 pt-5">
          <SheetTitle className="sr-only">মেনু</SheetTitle>
          <div className="px-2 pb-6">
            <Brand />
          </div>
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="mt-auto space-y-3 px-1 pt-6">
            <AccountCard name={name} role={role} onSignOut={logout} />
            <p className="px-1 text-[10px] text-slate-600">Dawat IT &amp; Consultancy</p>
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md print:hidden">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:min-h-[68px] lg:px-8">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="মেনু খুলুন"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-[18px]" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80 sm:block">
                {company}
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
                {title}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">{action}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-semibold text-white shadow-sm ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="অ্যাকাউন্ট মেনু"
                  >
                    {name.slice(0, 1).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="pb-1">
                    <span className="block truncate text-[13px] font-semibold text-foreground">
                      {name}
                    </span>
                    <span className="block text-[11px] font-normal">
                      {roleLabel[role] || role}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout} className="text-destructive">
                    <LogOut className="!text-destructive" />
                    সাইন আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Action row on phones: the header action is too wide inline. */}
          {action ? (
            <div className="mx-auto flex w-full max-w-6xl px-4 pb-3 sm:hidden">{action}</div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 print:p-0 print:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md lg:hidden print:hidden"
        aria-label="দ্রুত নেভিগেশন"
      >
        <div className="pb-safe mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-[19px]", active && "stroke-[2.4]")} />
                <span className="w-full truncate px-0.5 text-center">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="size-[19px]" />
            <span>আরও</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
