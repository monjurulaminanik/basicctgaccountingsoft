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
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, tint: "from-fuchsia-400 to-violet-400" },
  { href: "/entry", label: "নতুন এন্ট্রি", icon: PlusCircle, tint: "from-cyan-400 to-sky-400" },
  { href: "/parties", label: "পার্টি", icon: Users, tint: "from-amber-300 to-orange-400" },
  { href: "/ledger", label: "লেজার", icon: BookOpenText, tint: "from-emerald-400 to-teal-400" },
  { href: "/reports", label: "রিপোর্ট", icon: BarChart3, tint: "from-violet-400 to-indigo-400" },
  { href: "/settings", label: "সেটিংস", icon: Settings, tint: "from-rose-400 to-pink-400" },
];

const mobileNav = nav.slice(0, 4);

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operator",
  VIEWER: "Viewer",
};

function SidebarBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-24 size-64 rounded-full bg-fuchsia-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/3 size-56 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-0 size-64 rounded-full bg-indigo-500/25 blur-3xl"
      />
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2.5")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-base font-bold text-white shadow-lg shadow-fuchsia-900/40 ring-1 ring-white/20">
        P
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">Party Accounts</span>
        <span className="block truncate text-[11px] text-violet-200/60">Payable &amp; Receivable</span>
      </span>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="প্রধান মেনু">
      {nav.map(({ href, label, icon: Icon, tint }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)] ring-1 ring-white/10"
                : "text-violet-200/70 hover:bg-white/6 hover:text-white"
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b transition-opacity",
                tint,
                active ? "opacity-100" : "opacity-0"
              )}
              aria-hidden
            />
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg transition-all",
                active
                  ? cn("bg-gradient-to-br text-white shadow-md", tint)
                  : "bg-white/5 text-violet-200/70 group-hover:bg-white/10 group-hover:text-white"
              )}
            >
              <Icon className="size-[15px]" />
            </span>
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-2.5 backdrop-blur-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-sm font-semibold text-white shadow-inner">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-white">{name}</span>
        <span className="block truncate text-[11px] text-violet-200/60">{roleLabel[role] || role}</span>
      </span>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="সাইন আউট"
        title="সাইন আউট"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-violet-200/60 transition-colors hover:bg-white/10 hover:text-white"
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
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-[linear-gradient(180deg,#251455_0%,#2a1765_38%,#150c34_100%)] px-3 pb-6 pt-5 lg:flex print:hidden">
        <SidebarBackdrop />
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="px-2 pb-6">
            <Brand />
          </div>
          <NavLinks pathname={pathname} />
          <div className="mt-auto space-y-3 px-1 pt-6">
            <AccountCard name={name} role={role} onSignOut={logout} />
            <p className="px-1 text-[10px] text-violet-200/30">Dawat IT &amp; Consultancy</p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-hidden bg-[linear-gradient(180deg,#251455_0%,#2a1765_38%,#150c34_100%)] px-3 pb-6 pt-5">
          <SheetTitle className="sr-only">মেনু</SheetTitle>
          <SidebarBackdrop />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="px-2 pb-6">
              <Brand />
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-3 px-1 pt-6">
              <AccountCard name={name} role={role} onSignOut={logout} />
              <p className="px-1 text-[10px] text-violet-200/30">Dawat IT &amp; Consultancy</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-white/70 backdrop-blur-xl print:hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-violet-400/50 via-cyan-400/40 to-transparent" />
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
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] sm:block">
                <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  {company}
                </span>
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
                    className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-violet-500/30 ring-2 ring-white/70 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/60"
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
                  <DropdownMenuItem onSelect={logout} className="text-rose-600">
                    <LogOut className="!text-rose-600" />
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
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/85 backdrop-blur-xl lg:hidden print:hidden"
        aria-label="দ্রুত নেভিগেশন"
      >
        <div className="pb-safe mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
          {mobileNav.map(({ href, label, icon: Icon, tint }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors",
                  active ? "text-violet-700" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-xl transition-all",
                    active
                      ? cn("bg-gradient-to-br text-white shadow-md", tint)
                      : "bg-transparent"
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="w-full truncate px-0.5 text-center">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="grid size-8 place-items-center rounded-xl">
              <Menu className="size-[18px]" />
            </span>
            <span>আরও</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
