"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const highlights = [
  { icon: Wallet, title: "আলাদা পাওনা ও দেনা", body: "একই পার্টির receivable আর payable আলাদাভাবে হিসাব হয়।" },
  { icon: ShieldCheck, title: "নিরাপদ ও অডিটেড", body: "প্রতিটি এন্ট্রি audit log-এ থাকে, ভুল হলে void করা যায়।" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Login করা যায়নি।");
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#4c1d95_0%,#5b21b6_42%,#0e7490_100%)] p-10 lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-fuchsia-500/35 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-cyan-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-1/3 size-56 rounded-full bg-amber-300/20 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 via-violet-400 to-cyan-300 text-lg font-bold text-white shadow-lg shadow-fuchsia-900/40 ring-1 ring-white/30">
            P
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Party Accounts</p>
            <p className="text-[11px] text-violet-100/70">by Dawat IT &amp; Consultancy</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[32px] font-semibold leading-snug text-white xl:text-4xl">
            পাওনা ও দেনা — এক জায়গায়, একদম পরিষ্কার।
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-violet-100/80">
            সহজ এন্ট্রি, নির্ভুল পার্টি লেজার আর নিরাপদ রিপোর্টিং — প্রতিদিনের হিসাব রাখার জন্য তৈরি।
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/12 backdrop-blur-sm">
                  <Icon className="size-[17px] text-cyan-200" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-violet-100/70">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-violet-100/40">© {new Date().getFullYear()} Dawat IT &amp; Consultancy</p>
      </section>

      {/* Form panel */}
      <section className="flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-base font-bold text-white shadow-md shadow-violet-500/30">
              P
            </span>
            <div>
              <p className="text-sm font-semibold">Party Accounts</p>
              <p className="text-[11px] text-muted-foreground">Payable &amp; Receivable</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">স্বাগতম</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">আপনার account-এ login করুন</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Password লুকান" : "Password দেখুন"}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <span>{error}</span>
              </Alert>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Login হচ্ছে…
                </>
              ) : (
                <>
                  Login করুন <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              প্রথমবার ব্যবহার করছেন? README-এর seed command দিয়ে Admin account তৈরি করুন।
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
