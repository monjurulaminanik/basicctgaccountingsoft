"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { dateBD, taka } from "@/components/format";
import { TX_LABELS, TX_META, type TxType } from "@/lib/transaction-meta";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Party = { _id: string; name: string; phone?: string };
type Balance = { due: number; advance: number };
type Summary = {
  party: { _id: string; name: string; phone: string; type: string };
  balances: { receivable: Balance; payable: Balance };
  recent: Array<{
    _id: string;
    referenceNo: string;
    type: string;
    account: string;
    effect: string;
    amount: number;
    date: string;
  }>;
  count: number;
};

const typeOptions: Array<{ value: string; label: string }> = Object.entries(TX_META).map(
  ([value, meta]) => ({ value, label: meta.label })
);
typeOptions.push({ value: "ADJUSTMENT", label: "ম্যানুয়াল সমন্বয়" });

function signed(amount: number) {
  return `৳${new Intl.NumberFormat("bn-BD").format(amount)}`;
}

function EntryForm() {
  const sp = useSearchParams();
  const [parties, setParties] = useState<Party[] | null>(null);
  const [form, setForm] = useState({
    partyId: "",
    type: (sp.get("type") as TxType) || "SALES_BILL",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    note: "",
    paymentMethod: "CASH",
    account: "RECEIVABLE",
    effect: "INCREASE",
  });
  const [keepParty, setKeepParty] = useState(true);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d) => setParties(d.parties || []))
      .catch(() => setParties([]));
  }, []);

  const loadSummary = useCallback(async (id: string) => {
    if (!id) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const r = await fetch(`/api/parties/${id}/summary?limit=5`);
      const d = await r.json();
      if (r.ok) setSummary(d);
      else setSummary(null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(form.partyId);
  }, [form.partyId, loadSummary]);

  const isAdjustment = form.type === "ADJUSTMENT";
  const needPaymentMethod = ["RECEIPT", "PAYMENT", "RECEIPT_REFUND", "PAYMENT_REFUND"].includes(form.type);
  const meta = useMemo(
    () => (isAdjustment ? null : TX_META[form.type as Exclude<TxType, "ADJUSTMENT">]),
    [form.type, isAdjustment]
  );
  const amount = Number(form.amount);
  const noParties = parties !== null && parties.length === 0;

  const account = isAdjustment ? (form.account as "RECEIVABLE" | "PAYABLE") : meta?.account;
  const effect = isAdjustment ? (form.effect as "INCREASE" | "DECREASE") : meta?.effect;
  const accountBalance = summary
    ? account === "PAYABLE"
      ? summary.balances.payable
      : summary.balances.receivable
    : null;
  const currentRaw = accountBalance ? accountBalance.due - accountBalance.advance : 0;
  const projectedRaw = currentRaw + (amount > 0 && effect ? (effect === "INCREASE" ? amount : -amount) : 0);
  const projectedDue = Math.max(projectedRaw, 0);
  const projectedAdvance = Math.max(-projectedRaw, 0);

  function change(name: string, value: string) {
    setForm((old) => ({ ...old, [name]: value }));
    if (error) setError("");
  }

  function resetAmount() {
    setForm((old) => ({ ...old, amount: "", note: "" }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setReference("");
    try {
      const r = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Save করা যায়নি");
        return;
      }
      setReference(d.transaction.referenceNo);
      toast.success("এন্ট্রি সেভ হয়েছে", { description: d.transaction.referenceNo });
      setForm((old) => ({ ...old, partyId: keepParty ? old.partyId : "", amount: "", note: "" }));
      // Balances and the last-transaction list changed — refresh the snapshot.
      if (keepParty && form.partyId) loadSummary(form.partyId);
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Quick Entry</CardTitle>
          <CardDescription>
            এক ট্যাপে নতুন লেনদেন। সেভ হলে ঘরগুলো খালি হবে — চাইলে পার্টি নির্বাচন ধরে রাখতে পারবেন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {noParties && (
            <Alert variant="info">
              <Info />
              <span className="flex-1">কোনো পার্টি নেই। আগে একটি পার্টি যোগ করুন, তারপর এন্ট্রি করুন।</span>
              <Link href="/parties" className="shrink-0 font-semibold underline underline-offset-2">
                পার্টি যোগ
              </Link>
            </Alert>
          )}

          {reference && (
            <Alert variant="success">
              <CheckCircle2 />
              <span>
                সফলভাবে সেভ হয়েছে — <span className="font-semibold">{reference}</span>
              </span>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <Info />
              <span>{error}</span>
            </Alert>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">তারিখ</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => change("date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">লেনদেনের ধরন</Label>
                <Select id="type" value={form.type} onChange={(e) => change("type", e.target.value)}>
                  {typeOptions.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party">পার্টি</Label>
              {parties === null ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <Select
                  id="party"
                  value={form.partyId}
                  onChange={(e) => change("partyId", e.target.value)}
                  required
                >
                  <option value="">পার্টি নির্বাচন করুন</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                      {p.phone ? ` — ${p.phone}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Phone-sized party snapshot, right where the party is picked. */}
            {form.partyId && (
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3 lg:hidden">
                {summaryLoading && !summary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : summary ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">বর্তমান পাওনা</p>
                        <p className="num mt-0.5 text-[13px] font-semibold text-emerald-700">
                          {taka(summary.balances.receivable.due)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">বর্তমান দেনা</p>
                        <p className="num mt-0.5 text-[13px] font-semibold text-rose-700">
                          {taka(summary.balances.payable.due)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">অগ্রিম</p>
                        <p className="num mt-0.5 text-[13px] font-semibold">
                          {taka(summary.balances.receivable.advance + summary.balances.payable.advance)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
                      {summary.recent[0] ? (
                        <>
                          <span className="font-medium text-foreground">সর্বশেষ:</span>
                          {dateBD(summary.recent[0].date)} · {TX_LABELS[summary.recent[0].type] || summary.recent[0].type} ·{" "}
                          {taka(summary.recent[0].amount)}
                        </>
                      ) : (
                        "এই পার্টির কোনো পূর্বের লেনদেন নেই"
                      )}
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {isAdjustment && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-muted/40 p-3.5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">কোন হিসাব</Label>
                  <Select id="account" value={form.account} onChange={(e) => change("account", e.target.value)}>
                    <option value="RECEIVABLE">পাওনা (Receivable)</option>
                    <option value="PAYABLE">দেনা (Payable)</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effect">সমন্বয়ের প্রভাব</Label>
                  <Select id="effect" value={form.effect} onChange={(e) => change("effect", e.target.value)}>
                    <option value="INCREASE">বকেয়া বাড়বে</option>
                    <option value="DECREASE">বকেয়া কমবে</option>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={needPaymentMethod ? "space-y-2" : "space-y-2 sm:col-span-2"}>
                <Label htmlFor="amount">পরিমাণ (৳)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ৳
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    className="pl-7 text-base font-semibold"
                    value={form.amount}
                    onChange={(e) => change("amount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              {needPaymentMethod ? (
                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    id="method"
                    value={form.paymentMethod}
                    onChange={(e) => change("paymentMethod", e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                    <option value="MFS">MFS (bKash / Nagad)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">নোট / বিবরণ</Label>
              <Textarea
                id="note"
                rows={2}
                className="min-h-16"
                value={form.note}
                onChange={(e) => change("note", e.target.value)}
                placeholder="যেমন: Invoice # 305, November payment…"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={keepParty}
                  onChange={(e) => setKeepParty(e.target.checked)}
                  className="size-4 cursor-pointer accent-indigo-600"
                />
                সেভের পর পার্টি নির্বাচিত রাখুন
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={resetAmount} className="w-full sm:w-auto">
                  <RotateCcw className="size-4" /> Reset
                </Button>
                <Button type="submit" disabled={busy || noParties} className="w-full sm:w-auto">
                  {busy ? <Loader2 className="animate-spin" /> : <Save className="size-4" />}
                  {busy ? "সেভ হচ্ছে…" : "Save & New"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">এই এন্ট্রির প্রভাব</CardTitle>
            <CardDescription className="mt-1">পার্টি বেছে নিলে আগের বকেয়া ও শেষ লেনদেন দেখা যাবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {summary?.party.name || partyName(parties, form.partyId) || "—"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {summary?.party.phone || (form.partyId ? "মোবাইল নেই" : "পার্টি নির্বাচন করুন")}
                </p>
              </div>
              {form.partyId ? (
                <Badge variant={account === "PAYABLE" ? "warning" : "default"} className="shrink-0">
                  {isAdjustment ? "সমন্বয়" : meta?.label}
                </Badge>
              ) : null}
            </div>

            {summaryLoading && !summary ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : summary ? (
              <>
                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    বর্তমান অবস্থা
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-emerald-50/70 p-2.5 ring-1 ring-emerald-100">
                      <p className="text-[10px] text-emerald-800/70">পাওনা</p>
                      <p className="num mt-0.5 text-[13px] font-semibold text-emerald-700">
                        {taka(summary.balances.receivable.due)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50/70 p-2.5 ring-1 ring-rose-100">
                      <p className="text-[10px] text-rose-800/70">দেনা</p>
                      <p className="num mt-0.5 text-[13px] font-semibold text-rose-700">
                        {taka(summary.balances.payable.due)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-2.5 ring-1 ring-border">
                      <p className="text-[10px] text-muted-foreground">অগ্রিম</p>
                      <p className="num mt-0.5 text-[13px] font-semibold">
                        {taka(summary.balances.receivable.advance + summary.balances.payable.advance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      এন্ট্রির পর {account === "PAYABLE" ? "দেনা" : "পাওনা"}
                    </p>
                    <p className="num mt-0.5 text-base font-semibold">{taka(projectedDue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {amount > 0 ? "পরিবর্তন" : "পরিমাণ"}
                    </p>
                    <p
                      className={cn(
                        "num mt-0.5 text-[13px] font-semibold",
                        amount > 0
                          ? effect === "INCREASE"
                            ? "text-rose-600"
                            : "text-emerald-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {amount > 0 && effect ? `${effect === "INCREASE" ? "+" : "−"}${signed(amount)}` : "—"}
                    </p>
                  </div>
                </div>

                {projectedAdvance > 0 && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
                    অগ্রিম হবে: {taka(projectedAdvance)}
                  </p>
                )}

                <div className="rounded-lg bg-indigo-50/70 px-3 py-2.5 text-[12px] leading-relaxed text-indigo-900">
                  <span className="flex items-start gap-2">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {isAdjustment
                      ? `হিসাব ${form.account === "RECEIVABLE" ? "পাওনা" : "দেনা"} ${form.effect === "INCREASE" ? "বাড়বে" : "কমবে"}।`
                      : meta?.hint}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <Wallet className="size-5 text-muted-foreground" />
                <p className="text-[12px] text-muted-foreground">
                  আগের বকেয়া দেখতে উপরে একটি পার্টি নির্বাচন করুন।
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">সর্বশেষ লেনদেন</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/ledger">
                  লেজার <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {summary.recent.length ? (
                summary.recent.slice(0, 3).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{TX_LABELS[t.type] || t.type}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {dateBD(t.date)} · {t.referenceNo}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "num shrink-0 text-[13px] font-semibold",
                        t.effect === "INCREASE" ? "text-rose-700" : "text-emerald-700"
                      )}
                    >
                      {t.effect === "INCREASE" ? "+" : "−"}
                      {taka(t.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-2 py-5 text-center text-[12px] text-muted-foreground">
                  এই পার্টির কোনো পূর্বের লেনদেন নেই — এটি প্রথম এন্ট্রি হবে।
                </p>
              )}
              {summary.count > 3 && (
                <p className="px-2 pt-1 text-[11px] text-muted-foreground">
                  মোট {summary.count}টি লেনদেন · লেজারে সব দেখুন
                </p>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

function partyName(parties: Party[] | null, id: string) {
  return parties?.find((p) => p._id === id)?.name;
}

export default function EntryPage() {
  return (
    <AppShell title="নতুন লেনদেন">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <EntryForm />
      </Suspense>
    </AppShell>
  );
}
