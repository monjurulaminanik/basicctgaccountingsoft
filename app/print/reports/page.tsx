import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getPartyBalanceRows } from "@/lib/reports";
import { getCompanySettings } from "@/lib/settings";
import { dateBD, taka } from "@/components/format";
import { PrintToolbar } from "@/components/print-toolbar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Party Balance Report — PDF" };

const typeLabel: Record<string, string> = {
  CUSTOMER: "কাস্টমার",
  SUPPLIER: "সাপ্লায়ার",
  BOTH: "কাস্টমার + সাপ্লায়ার",
};

export default async function PrintReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [rows, company] = await Promise.all([getPartyBalanceRows(), getCompanySettings()]);
  const receivable = rows.reduce((s, r) => s + r.balances.receivable.due, 0);
  const payable = rows.reduce((s, r) => s + r.balances.payable.due, 0);
  const advance = rows.reduce(
    (s, r) => s + r.balances.receivable.advance + r.balances.payable.advance,
    0
  );
  const generated = new Intl.DateTimeFormat("bn-BD", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  return (
    <main className="min-h-dvh bg-slate-100 pb-8 print:bg-white print:pb-0">
      <div className="mx-auto w-full max-w-[900px] px-3 print:max-w-none print:px-0">
        <PrintToolbar title="Party Balance Summary" />

        <article className="print-doc mx-auto w-full max-w-[820px] overflow-hidden bg-white p-6 text-[13px] text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-9 print:max-w-none print:p-0 print:shadow-none print:ring-0">
          <div className="mb-5 h-1.5 w-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 print:mb-4 print:h-1" />
          <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{company.companyName}</h1>
              <div className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-slate-600">
                {company.address ? <p>{company.address}</p> : null}
                {company.phone ? <p>মোবাইল: {company.phone}</p> : null}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="inline-block rounded bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Balance Report
              </p>
              <p className="mt-2 text-[11px] text-slate-500">তৈরি: {generated}</p>
              <p className="text-[11px] text-slate-500">আজ: {dateBD(new Date())}</p>
            </div>
          </header>

          <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "মোট পাওনা", value: taka(receivable) },
              { label: "মোট দেনা", value: taka(payable) },
              { label: "মোট অগ্রিম", value: taka(advance) },
              { label: "পার্টি সংখ্যা", value: String(rows.length) },
            ].map((item) => (
              <div key={item.label} className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="num mt-0.5 text-[13px] font-semibold">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[560px] border-collapse text-[11px] print:min-w-0">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-2 py-2 text-left font-semibold">পার্টি</th>
                  <th className="px-2 py-2 text-left font-semibold">ধরন</th>
                  <th className="px-2 py-2 text-left font-semibold">মোবাইল</th>
                  <th className="px-2 py-2 text-right font-semibold">পাওনা</th>
                  <th className="px-2 py-2 text-right font-semibold">দেনা</th>
                  <th className="px-2 py-2 text-right font-semibold">অগ্রিম</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r, i) => (
                    <tr key={r.party._id} className={i % 2 ? "bg-slate-50/60" : ""}>
                      <td className="px-2 py-1.5 font-medium">{r.party.name}</td>
                      <td className="px-2 py-1.5 text-slate-600">{typeLabel[r.party.type] || r.party.type}</td>
                      <td className="px-2 py-1.5 text-slate-600">{r.party.phone || "—"}</td>
                      <td className="num px-2 py-1.5 text-right text-emerald-700">{taka(r.balances.receivable.due)}</td>
                      <td className="num px-2 py-1.5 text-right text-rose-700">{taka(r.balances.payable.due)}</td>
                      <td className="num px-2 py-1.5 text-right">
                        {taka(r.balances.receivable.advance + r.balances.payable.advance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                      কোনো পার্টি নেই।
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={3} className="px-2 py-2 text-right font-semibold">
                    মোট
                  </td>
                  <td className="num px-2 py-2 text-right font-bold">{taka(receivable)}</td>
                  <td className="num px-2 py-2 text-right font-bold">{taka(payable)}</td>
                  <td className="num px-2 py-2 text-right font-bold">{taka(advance)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-[10px] leading-relaxed text-slate-500">
              আজকের posted লেনদেন পর্যন্ত হিসাব। মুদ্রা: {company.currency} ({company.currencySymbol})।
            </p>
            <div className="w-40 text-center">
              <div className="border-b border-slate-400 pb-6" />
              <p className="mt-1 text-[10px] text-slate-500">অনুমোদিত স্বাক্ষর</p>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
