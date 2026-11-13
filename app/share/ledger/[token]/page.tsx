import Link from "next/link";
import { Link2Off, Lock } from "lucide-react";

import { ShareLink } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { getLedgerStatement } from "@/lib/ledger";
import { getCompanySettings } from "@/lib/settings";
import { LedgerDocument } from "@/components/ledger-document";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Statement — Party Accounts",
  robots: { index: false, follow: false },
};

export default async function SharedLedgerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connectDB();
  const link = await ShareLink.findOne({ token, revokedAt: { $exists: false } }).lean();

  const expired = link?.expiresAt ? new Date(link.expiresAt) < new Date() : false;
  if (!link || expired) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
            {link && expired ? <Link2Off className="size-5" /> : <Lock className="size-5" />}
          </span>
          <h1 className="mt-4 text-lg font-semibold">
            {link && expired ? "লিংকটির মেয়াদ শেষ" : "লিংকটি পাওয়া যায়নি"}
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            এই শেয়ার লিংকটি বন্ধ করা হয়েছে বা মেয়াদ শেষ হয়েছে। নতুন লিংকের জন্য হিসাবরক্ষকের সাথে যোগাযোগ করুন।
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
          >
            Party Accounts-এ যান
          </Link>
        </div>
      </main>
    );
  }

  const [statement, company] = await Promise.all([
    getLedgerStatement(String(link.partyId)),
    getCompanySettings(),
  ]);

  if (!statement) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 px-4">
        <p className="rounded-xl bg-white px-5 py-4 text-sm shadow-sm">পার্টি পাওয়া যায়নি।</p>
      </main>
    );
  }

  await ShareLink.updateOne({ _id: link._id }, { $inc: { views: 1 } }).catch(() => {});

  return (
    <main className="min-h-dvh bg-slate-100 pb-8">
      <div className="mx-auto w-full max-w-[900px] px-3">
        <div className="sticky top-0 z-20 -mb-2 mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-3 py-2.5 backdrop-blur">
          <p className="mr-auto min-w-0 truncate text-[13px] font-semibold text-slate-700">
            {company.companyName} · Statement
          </p>
          <span className="hidden text-[11px] text-slate-500 sm:inline">শেয়ার করা লিংক — সম্পাদনা করা যাবে না</span>
          <PrintButton />
        </div>
        <LedgerDocument statement={statement} company={company} shared />
        <p className="mt-4 text-center text-[10px] text-slate-400">
          Party Accounts · Dawat IT &amp; Consultancy
        </p>
      </div>
    </main>
  );
}

