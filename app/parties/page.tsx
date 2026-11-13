"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, UserRoundPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { taka } from "@/components/format";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Party = {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  type: string;
  openingReceivable: number;
  openingPayable: number;
  balances: {
    receivable: { due: number; advance: number };
    payable: { due: number; advance: number };
  };
};

const empty = { name: "", phone: "", address: "", type: "BOTH", openingReceivable: "", openingPayable: "" };
const typeLabel: Record<string, string> = { CUSTOMER: "কাস্টমার", SUPPLIER: "সাপ্লায়ার", BOTH: "কাস্টমার + সাপ্লায়ার" };

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[] | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/parties");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "পার্টি লোড করা যায়নি");
      setParties(d.parties || []);
    } catch (e) {
      setParties([]);
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties || [];
    return (parties || []).filter(
      (p) => p.name.toLowerCase().includes(q) || (p.phone || "").toLowerCase().includes(q)
    );
  }, [parties, search]);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setError("");
    setShow(true);
  }

  function openEdit(p: Party) {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone || "",
      address: p.address || "",
      type: p.type,
      openingReceivable: p.openingReceivable ? String(p.openingReceivable) : "",
      openingPayable: p.openingPayable ? String(p.openingPayable) : "",
    });
    setError("");
    setShow(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      openingReceivable: Number(form.openingReceivable || 0),
      openingPayable: Number(form.openingPayable || 0),
    };
    try {
      const r = await fetch(editing ? `/api/parties/${editing._id}` : "/api/parties", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Save করা যায়নি");
        return;
      }
      toast.success(editing ? "পার্টি আপডেট হয়েছে" : "নতুন পার্টি যোগ হয়েছে");
      setShow(false);
      setEditing(null);
      setForm(empty);
      load();
    } catch {
      setError("সার্ভারে সংযোগ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  const total = parties?.length ?? 0;

  return (
    <AppShell
      title="পার্টি ম্যানেজমেন্ট"
      action={
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus className="size-4" /> নতুন পার্টি
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="পার্টি খুঁজুন"
                placeholder="নাম বা মোবাইল দিয়ে খুঁজুন"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-[13px] text-muted-foreground sm:ml-auto">
              মোট {total}টি পার্টি
            </span>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border/70 sm:hidden">
            {parties === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : filtered.length ? (
              filtered.map((p) => (
                <div key={p._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {typeLabel[p.type] || p.type}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="icon-sm" aria-label={`${p.name} এডিট`} onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5">
                    <div>
                      <dt className="text-[10px] text-muted-foreground">পাওনা</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold text-emerald-700">
                        {taka(p.balances.receivable.due)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground">দেনা</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold text-rose-700">
                        {taka(p.balances.payable.due)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground">অগ্রিম</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold">
                        {taka(p.balances.receivable.advance + p.balances.payable.advance)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            ) : (
              <EmptyState hasSearch={Boolean(search.trim())} onAdd={openAdd} />
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-6">পার্টি</TableHead>
                  <TableHead>ধরণ</TableHead>
                  <TableHead>মোবাইল</TableHead>
                  <TableHead className="text-right">পাওনা</TableHead>
                  <TableHead className="text-right">দেনা</TableHead>
                  <TableHead className="text-right">অগ্রিম</TableHead>
                  <TableHead className="pr-5 text-right sm:pr-6">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties === null ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-5 sm:pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell className="pr-5 sm:pr-6"><Skeleton className="ml-auto h-4 w-10" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length ? (
                  filtered.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="pl-5 sm:pl-6">
                        <span className="block font-medium">{p.name}</span>
                        {p.address ? (
                          <span className="block max-w-[16rem] truncate text-[11px] text-muted-foreground">{p.address}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.type === "CUSTOMER" ? "success" : p.type === "SUPPLIER" ? "warning" : "default"}>
                          {typeLabel[p.type] || p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                      <TableCell className="num text-right font-semibold text-emerald-700">{taka(p.balances.receivable.due)}</TableCell>
                      <TableCell className="num text-right font-semibold text-rose-700">{taka(p.balances.payable.due)}</TableCell>
                      <TableCell className="num text-right text-muted-foreground">
                        {taka(p.balances.receivable.advance + p.balances.payable.advance)}
                      </TableCell>
                      <TableCell className="pr-5 text-right sm:pr-6">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="size-3.5" /> এডিট
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-0">
                      <EmptyState hasSearch={Boolean(search.trim())} onAdd={openAdd} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "পার্টি এডিট করুন" : "নতুন পার্টি যোগ করুন"}</DialogTitle>
            <DialogDescription>
              নাম ও ধরন আবশ্যক। Opening balance একবার সেভ করার পর শুধু adjustment দিয়ে ঠিক করা যায়।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="party-name">নাম <span className="text-destructive">*</span></Label>
                <Input
                  id="party-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                  placeholder="যেমন: আহমেদ মিয়া"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party-type">ধরন <span className="text-destructive">*</span></Label>
                <Select
                  id="party-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="BOTH">কাস্টমার + সাপ্লায়ার</option>
                  <option value="CUSTOMER">কাস্টমার</option>
                  <option value="SUPPLIER">সাপ্লায়ার</option>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="party-phone">মোবাইল</Label>
                <Input
                  id="party-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party-receivable">Opening Receivable (৳)</Label>
                <Input
                  id="party-receivable"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.openingReceivable}
                  onChange={(e) => setForm({ ...form, openingReceivable: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-[11px] text-muted-foreground">আমরা এই পার্টির কাছে পাব</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="party-payable">Opening Payable (৳)</Label>
                <Input
                  id="party-payable"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.openingPayable}
                  onChange={(e) => setForm({ ...form, openingPayable: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-[11px] text-muted-foreground">আমরা এই পার্টিকে দেব</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="party-address">ঠিকানা</Label>
                <Textarea
                  id="party-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="বাজার / এলাকা / নোট"
                />
              </div>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShow(false)} className="w-full sm:w-auto">
                বাতিল
              </Button>
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy ? <Loader2 className="animate-spin" /> : null}
                {editing ? "আপডেট করুন" : "পার্টি সেভ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        {hasSearch ? <Search className="size-5" /> : <Users className="size-5" />}
      </span>
      <p className="text-sm font-medium">{hasSearch ? "কোনো পার্টি পাওয়া যায়নি" : "এখনও কোনো পার্টি নেই"}</p>
      <p className="max-w-xs text-[12px] text-muted-foreground">
        {hasSearch ? "অন্য নাম বা মোবাইল দিয়ে খুঁজুন।" : "প্রথম পার্টি যোগ করে লেনদেন শুরু করুন।"}
      </p>
      {!hasSearch && (
        <Button size="sm" variant="outline" className="mt-2" onClick={onAdd}>
          <UserRoundPlus className="size-4" /> পার্টি যোগ করুন
        </Button>
      )}
    </div>
  );
}
