"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Building2, DatabaseBackup, Loader2, Save, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const base = { companyName: "", address: "", phone: "", currency: "BDT", currencySymbol: "৳" };

const policies = [
  {
    icon: ShieldCheck,
    title: "Role permissions",
    body: "Admin — settings, void, user management। Operator — party ও entry। Viewer — শুধু report ও ledger।",
  },
  {
    icon: BadgeCheck,
    title: "Financial entry safety",
    body: "Hard delete নেই। ভুল entry Admin void করবে এবং audit log-এ কারণ থাকবে।",
  },
  {
    icon: DatabaseBackup,
    title: "Backup schedule",
    body: "লোকাল MongoDB-তে কাজ করলে .runtime\\data ফোল্ডার ব্যাকআপ রাখুন; production-এ Atlas backup চালু করুন।",
  },
];

export default function SettingsPage() {
  const [form, setForm] = useState(base);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            companyName: d.settings.companyName || "",
            address: d.settings.address || "",
            phone: d.settings.phone || "",
            currency: d.settings.currency || "BDT",
            currencySymbol: d.settings.currencySymbol || "৳",
          });
        }
      })
      .catch(() => toast.error("সেটিংস লোড করা যায়নি"))
      .finally(() => setLoaded(true));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Update করা যায়নি");
        return;
      }
      setMessage("কোম্পানি সেটিংস সেভ হয়েছে।");
      toast.success("সেটিংস সেভ হয়েছে");
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="সেটিংস">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>Company Profile</CardTitle>
                <CardDescription className="mt-0.5">রিপোর্ট ও প্রিন্ট হেডারে এই তথ্য ব্যবহার হবে।</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="destructive">{error}</Alert>}

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    required
                    placeholder="যেমন: Dawat IT & Consultancy"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      placeholder="BDT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Currency Symbol</Label>
                    <Input
                      id="symbol"
                      value={form.currencySymbol}
                      onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                      placeholder="৳"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="বাজার / এলাকা / জেলা"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                  <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                    {busy ? <Loader2 className="animate-spin" /> : <Save className="size-4" />}
                    {busy ? "সেভ হচ্ছে…" : "সেটিংস সেভ করুন"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Security &amp; Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {policies.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 via-fuchsia-50/70 to-cyan-50/70">
            <CardContent className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-500/30">
                <Wallet className="size-[17px]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-indigo-950">Party Accounts</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-indigo-900/70">
                  পাওনা ও দেনার হিসাব, লেজার এবং রিপোর্ট — সব এক জায়গায়।
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
