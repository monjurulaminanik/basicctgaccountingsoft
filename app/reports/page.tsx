"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, Download, FileSpreadsheet, Printer, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { taka } from "@/components/format";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  party: { _id: string; name: string; phone?: string; type: string };
  balances: {
    receivable: { due: number; advance: number };
    payable: { due: number; advance: number };
  };
};

const typeLabel: Record<string, string> = {
  CUSTOMER: "কাস্টমার",
  SUPPLIER: "সাপ্লায়ার",
  BOTH: "কাস্টমার + সাপ্লায়ার",
};

export default function ReportsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [company, setCompany] = useState<{ companyName: string; address: string; phone: string } | null>(null);

  useEffect(() => {
    fetch("/api/reports/party-balances")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {
        setRows([]);
        toast.error("রিপোর্ট লোড করা যায়নি");
      });
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

  const totals = useMemo(() => {
    const list = rows || [];
    return {
      receivable: list.reduce((s, r) => s + r.balances.receivable.due, 0),
      payable: list.reduce((s, r) => s + r.balances.payable.due, 0),
      count: list.length,
    };
  }, [rows]);

  function csv() {
    if (!rows?.length) {
      toast.info("এক্সপোর্ট করার মতো কোনো ডেটা নেই");
      return;
    }
    const escape = (x: string | number) => `"${String(x).replaceAll('"', '""')}"`;
    const text = [
      ["Party", "Phone", "Type", "Receivable Due", "Payable Due", "Receivable Advance", "Payable Advance"],
      ...rows.map((r) => [
        r.party.name,
        r.party.phone || "",
        r.party.type,
        r.balances.receivable.due,
        r.balances.payable.due,
        r.balances.receivable.advance,
        r.balances.payable.advance,
      ]),
    ]
      .map((r) => r.map(escape).join(","))
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" }));
    a.download = `party-balances-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV ডাউনলোড হয়েছে");
  }

  return (
    <AppShell
      title="রিপোর্টস"
      action={
        <div className="flex w-full gap-2 sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <a href="/print/reports" target="_blank" rel="noopener noreferrer">
              <Printer className="size-4" /> PDF
            </a>
          </Button>
          <Button onClick={csv} className="flex-1 sm:flex-none">
            <Download className="size-4" /> CSV
          </Button>
        </div>
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
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="মোট পাওনা" value={taka(totals.receivable)} icon={ArrowDownLeft} tone="primary" note="সব পার্টি মিলিয়ে" />
        <StatCard label="মোট দেনা" value={taka(totals.payable)} icon={ArrowUpRight} tone="warning" note="সব পার্টি মিলিয়ে" />
        <StatCard label="মোট পার্টি" value={String(totals.count)} icon={Users} tone="violet" note="সক্রিয় পার্টি সংখ্যা" className="col-span-2 sm:col-span-1" />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:hidden">
        {[
          { title: "Party Balance Summary", body: "প্রতিটি পার্টির বর্তমান পাওনা ও দেনা।", icon: FileSpreadsheet },
          { title: "Statement", body: "লেজার স্ক্রিন থেকে তারিখ ফিল্টার দিয়ে বিবরণী।", icon: FileSpreadsheet },
          { title: "Printable", body: "ব্রাউজার print থেকেই PDF সেভ করা যায়।", icon: Printer },
        ].map(({ title, body, icon: Icon }) => (
          <Card key={title} className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 print-full">
        <CardHeader className="pb-4">
          <CardTitle>Party Balance Summary</CardTitle>
          <CardDescription className="mt-1">আজকের posted লেনদেন পর্যন্ত হিসাব</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          {/* Mobile list */}
          <div className="divide-y divide-border/70 sm:hidden">
            {rows === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            ) : rows.length ? (
              rows.map((r) => (
                <div key={r.party._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.party.name}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {typeLabel[r.party.type] || r.party.type}
                        {r.party.phone ? ` · ${r.party.phone}` : ""}
                      </p>
                    </div>
                    <Badge variant={r.party.type === "SUPPLIER" ? "warning" : "default"}>
                      {r.party.type === "CUSTOMER" ? "Customer" : r.party.type === "SUPPLIER" ? "Supplier" : "Both"}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5">
                    <div>
                      <dt className="text-[10px] text-muted-foreground">পাওনা</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold text-emerald-700">{taka(r.balances.receivable.due)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground">দেনা</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold text-rose-700">{taka(r.balances.payable.due)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground">অগ্রিম</dt>
                      <dd className="num mt-0.5 text-[13px] font-semibold">
                        {taka(r.balances.receivable.advance + r.balances.payable.advance)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">রিপোর্টের জন্য কোনো পার্টি নেই</p>
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
                  <TableHead className="text-right">পাওনা বাকি</TableHead>
                  <TableHead className="text-right">দেনা বাকি</TableHead>
                  <TableHead className="pr-5 text-right sm:pr-6">অগ্রিম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows === null ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-5 sm:pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell className="pr-5 sm:pr-6"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : rows.length ? (
                  rows.map((r) => (
                    <TableRow key={r.party._id}>
                      <TableCell className="pl-5 font-medium sm:pl-6">{r.party.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.party.type === "CUSTOMER" ? "success" : r.party.type === "SUPPLIER" ? "warning" : "default"}>
                          {typeLabel[r.party.type] || r.party.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.party.phone || "—"}</TableCell>
                      <TableCell className="num text-right font-semibold text-emerald-700">{taka(r.balances.receivable.due)}</TableCell>
                      <TableCell className="num text-right font-semibold text-rose-700">{taka(r.balances.payable.due)}</TableCell>
                      <TableCell className="num pr-5 text-right text-muted-foreground sm:pr-6">
                        {taka(r.balances.receivable.advance + r.balances.payable.advance)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      রিপোর্টের জন্য কোনো পার্টি নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
