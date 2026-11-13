"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, ArrowDownLeft, ArrowUpRight, Building2, FileDown, Search } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { dateBD, taka } from "@/components/format";
import { StatCard } from "@/components/stat-card";
import { ShareLedgerDialog } from "@/components/share-ledger-dialog";
import { TX_LABELS } from "@/lib/transaction-meta";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Party = { _id: string; name: string };
type Company = { companyName: string; address: string; phone: string };
type Row = {
  _id: string;
  date: string;
  referenceNo: string;
  type: string;
  account: string;
  effect: string;
  amount: number;
  note?: string;
  running: { receivable: { due: number }; payable: { due: number } };
};
type Ledger = {
  party: Party;
  opening: { receivable: { due: number }; payable: { due: number } };
  closing: {
    receivable: { due: number; advance: number };
    payable: { due: number; advance: number };
  };
  rows: Row[];
};

export default function LedgerPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [partyId, setPartyId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then((d) => setParties(d.parties || []))
      .catch(() => setParties([]));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setCompany({
            companyName: d.settings.companyName || "Party Accounts",
            address: d.settings.address || "",
            phone: d.settings.phone || "",
          });
        }
      })
      .catch(() => setCompany(null));
  }, []);

  const load = useCallback(async () => {
    if (!partyId) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/ledger/${partyId}?from=${from}&to=${to}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Statement লোড করা যায়নি");
      setLedger(d);
    } catch (e) {
      setError((e as Error).message);
      setLedger(null);
    } finally {
      setLoading(false);
    }
  }, [partyId, from, to]);

  useEffect(() => {
    if (partyId) load();
  }, [partyId, from, to, load]);

  const closing = ledger?.closing;
  const advances = useMemo(
    () => (closing ? closing.receivable.advance + closing.payable.advance : 0),
    [closing]
  );

  return (
    <AppShell
      title="পার্টি লেজার"
      action={
        ledger ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a
              href={`/print/ledger/${partyId}?from=${from}&to=${to}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileDown className="size-4" /> PDF / প্রিন্ট
            </a>
          </Button>
        ) : null
      }
    >
      {company && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="size-[17px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{company.companyName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {[company.address, company.phone ? `মোবাইল: ${company.phone}` : ""].filter(Boolean).join(" · ") ||
                "কোম্পানির তথ্য সেটিংসে যোগ করুন"}
            </p>
          </div>
        </div>
      )}

      <Card className="print:hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Statement ফিল্টার</CardTitle>
          <CardDescription>পার্টি নির্বাচন করুন — তারিখ দিলে নির্দিষ্ট সময়ের হিসাব দেখাবে।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="party">পার্টি</Label>
              <Select id="party" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">পার্টি নির্বাচন করুন</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">শুরুর তারিখ</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">শেষ তারিখ</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={load} disabled={!partyId || loading} className="w-full">
                <Search className="size-4" /> দেখুন
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}

      {!partyId && !error && (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
              <BookOpenText className="size-5" />
            </span>
            <p className="text-sm font-medium">একটি পার্টি বেছে নিন</p>
            <p className="max-w-xs text-[12px] text-muted-foreground">
              তার সম্পূর্ণ লেনদেন, চলমান পাওনা ও দেনা এখানে দেখা যাবে।
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !ledger && partyId ? (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-6 w-28" />
            </Card>
          ))}
        </div>
      ) : null}

      {ledger && (
        <div className="mt-4 space-y-4">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4">
            <StatCard label="Opening পাওনা" value={taka(ledger.opening.receivable.due)} icon={ArrowDownLeft} tone="primary" />
            <StatCard label="Opening দেনা" value={taka(ledger.opening.payable.due)} icon={ArrowUpRight} tone="warning" />
            <StatCard label="Closing পাওনা" value={taka(closing!.receivable.due)} icon={ArrowDownLeft} tone="success" />
            <StatCard label="Closing দেনা" value={taka(closing!.payable.due)} icon={ArrowUpRight} tone="rose" />
          </section>

          <Card className="print-full">
            <CardHeader className="flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="truncate">{ledger.party.name}</CardTitle>
                <CardDescription className="mt-1">
                  {from || to ? `${from || "শুরু"} — ${to || "আজ"} · ` : ""}
                  মোট {ledger.rows.length}টি লেনদেন
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {advances > 0 && <Badge variant="success">অগ্রিম: {taka(advances)}</Badge>}
                <ShareLedgerDialog partyId={partyId} partyName={ledger.party.name} />
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/print/ledger/${partyId}?from=${from}&to=${to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown className="size-4" /> PDF
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 sm:px-0">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 sm:pl-6">তারিখ</TableHead>
                    <TableHead>রেফারেন্স</TableHead>
                    <TableHead>বিবরণ</TableHead>
                    <TableHead>হিসাব</TableHead>
                    <TableHead className="text-right">পরিমাণ</TableHead>
                    <TableHead className="text-right">পাওনা বাকি</TableHead>
                    <TableHead className="pr-5 text-right sm:pr-6">দেনা বাকি</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.rows.length ? (
                    ledger.rows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="whitespace-nowrap pl-5 text-muted-foreground sm:pl-6">
                          {dateBD(row.date)}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {row.referenceNo}
                        </TableCell>
                        <TableCell>
                          <span className="block font-medium">{TX_LABELS[row.type] || row.type}</span>
                          {row.note ? (
                            <span className="block max-w-[18rem] truncate text-[11px] text-muted-foreground">
                              {row.note}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.account === "PAYABLE" ? "warning" : "secondary"}>
                            {row.account === "PAYABLE" ? "দেনা" : "পাওনা"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`num text-right font-semibold ${
                            row.effect === "INCREASE" ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {row.effect === "INCREASE" ? "+" : "−"}
                          {taka(row.amount)}
                        </TableCell>
                        <TableCell className="num text-right">{taka(row.running.receivable.due)}</TableCell>
                        <TableCell className="num pr-5 text-right sm:pr-6">
                          {taka(row.running.payable.due)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        এই সময়ে কোনো লেনদেন নেই।
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
