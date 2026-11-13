"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BookOpenText,
  Loader2,
  PlusCircle,
  ReceiptText,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { dateBD, taka } from "@/components/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";

type Dashboard = {
  totals: { receivable: number; payable: number; collected: number; paid: number };
  recent: Array<{
    _id: string;
    referenceNo: string;
    type: string;
    amount: number;
    date: string;
    partyId: { name: string } | null;
  }>;
};

const labels: Record<string, string> = {
  SALES_BILL: "বিক্রয় বিল",
  PURCHASE_BILL: "ক্রয় বিল",
  RECEIPT: "আদায়",
  PAYMENT: "পরিশোধ",
  SALES_RETURN: "বিক্রয় ফেরত",
  PURCHASE_RETURN: "ক্রয় ফেরত",
  RECEIPT_REFUND: "আদায় ফেরত",
  PAYMENT_REFUND: "পেমেন্ট ফেরত",
  ADJUSTMENT: "সমন্বয়",
};

const inflow = new Set(["RECEIPT", "PURCHASE_RETURN", "PAYMENT_REFUND"]);

const quickLinks = [
  { href: "/entry?type=SALES_BILL", label: "বিক্রয় বিল", hint: "পাওনা বাড়বে", icon: ShoppingCart, tone: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30" },
  { href: "/entry?type=RECEIPT", label: "টাকা আদায়", hint: "পাওনা কমবে", icon: BanknoteArrowDown, tone: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30" },
  { href: "/entry?type=PURCHASE_BILL", label: "ক্রয় বিল", hint: "দেনা বাড়বে", icon: ReceiptText, tone: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30" },
  { href: "/entry?type=PAYMENT", label: "সাপ্লায়ার পেমেন্ট", hint: "দেনা কমবে", icon: BanknoteArrowUp, tone: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30" },
];

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "ড্যাশবোর্ড লোড করা যায়নি");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const totals = data?.totals;

  return (
    <AppShell
      title="ড্যাশবোর্ড"
      action={
        <Button asChild className="w-full sm:w-auto">
          <Link href="/entry">
            <PlusCircle className="size-4" /> নতুন এন্ট্রি
          </Link>
        </Button>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-5">
          {error}
        </Alert>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {totals ? (
          <>
            <StatCard
              label="মোট পাওনা"
              value={taka(totals.receivable)}
              note="কাস্টমার থেকে পাওয়ার আছে"
              icon={ArrowDownLeft}
              tone="primary"
            />
            <StatCard
              label="মোট দেনা"
              value={taka(totals.payable)}
              note="সাপ্লায়ারকে দেওয়ার আছে"
              icon={ArrowUpRight}
              tone="warning"
            />
            <StatCard
              label="এই মাসে আদায়"
              value={taka(totals.collected)}
              note="Customer collection"
              icon={BanknoteArrowDown}
              tone="success"
            />
            <StatCard
              label="এই মাসে পরিশোধ"
              value={taka(totals.paid)}
              note="Supplier payment"
              icon={BanknoteArrowUp}
              tone="violet"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-9 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-6 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </Card>
          ))
        )}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <CardTitle>সাম্প্রতিক লেনদেন</CardTitle>
              <CardDescription className="mt-1">সর্বশেষ পোস্ট করা এন্ট্রি</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/ledger">
                সব দেখুন <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 sm:pl-6">পার্টি</TableHead>
                  <TableHead className="hidden sm:table-cell">ধরণ</TableHead>
                  <TableHead className="hidden md:table-cell">রেফারেন্স</TableHead>
                  <TableHead className="hidden lg:table-cell">তারিখ</TableHead>
                  <TableHead className="pr-5 text-right sm:pr-6">পরিমাণ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-5 sm:pl-6">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="pr-5 text-right sm:pr-6">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.recent.length ? (
                  data.recent.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="max-w-[9rem] pl-5 font-medium sm:max-w-none sm:pl-6">
                        <span className="block truncate">{t.partyId?.name || "—"}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground sm:hidden">
                          {labels[t.type] || t.type} · {dateBD(t.date)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={inflow.has(t.type) ? "success" : "secondary"}>
                          {labels[t.type] || t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-[12px] text-muted-foreground md:table-cell">
                        {t.referenceNo}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {dateBD(t.date)}
                      </TableCell>
                      <TableCell className="num pr-5 text-right font-semibold sm:pr-6">
                        {taka(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                        <Wallet className="size-6" />
                        <p className="text-sm font-medium text-foreground">এখনও কোনো লেনদেন নেই</p>
                        <p className="text-[12px]">প্রথম এন্ট্রি দিয়ে শুরু করুন।</p>
                        <Button asChild size="sm" variant="outline" className="mt-2">
                          <Link href="/entry">এন্ট্রি করুন</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>দ্রুত কাজ</CardTitle>
            <CardDescription className="mt-1">এক ট্যাপে নতুন এন্ট্রি শুরু করুন</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 pt-0">
            {quickLinks.map(({ href, label, hint, icon: Icon, tone }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-violet-200/70 hover:bg-violet-50/60"
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-[17px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/parties">
                  <Users className="size-4" /> নতুন পার্টি
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/ledger">
                  <BookOpenText className="size-4" /> লেজার
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {data === null && !error && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> ডেটা লোড হচ্ছে…
        </p>
      )}
    </AppShell>
  );
}
