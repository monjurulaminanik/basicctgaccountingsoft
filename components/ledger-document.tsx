import { dateBD, taka } from "@/components/format";
import { TX_LABELS } from "@/lib/transaction-meta";
import type { LedgerStatement } from "@/lib/ledger";
import type { CompanySettings } from "@/lib/settings";

const typeLabel: Record<string, string> = {
  CUSTOMER: "কাস্টমার",
  SUPPLIER: "সাপ্লায়ার",
  BOTH: "কাস্টমার + সাপ্লায়ার",
};

/**
 * A4-friendly statement used by the PDF view and the public share link.
 * Pure markup (no hooks) so it can render on the server.
 */
export function LedgerDocument({
  statement,
  company,
  period,
  shared = false,
}: {
  statement: LedgerStatement;
  company: CompanySettings;
  period?: { from?: string; to?: string };
  shared?: boolean;
}) {
  const { party, opening, closing, rows } = statement;
  const advance = closing.receivable.advance + closing.payable.advance;
  const generated = new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <article className="print-doc mx-auto w-full max-w-[820px] overflow-hidden bg-white p-6 text-[13px] text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-9 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <div className="mb-5 h-1.5 w-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 print:mb-4 print:h-1" />
      {/* Document header */}
      <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{company.companyName}</h1>
          <div className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-slate-600">
            {company.address ? <p>{company.address}</p> : null}
            {company.phone ? <p>মোবাইল: {company.phone}</p> : null}
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="inline-block rounded bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            Statement of Account
          </p>
          <p className="mt-2 text-[11px] text-slate-500">তৈরি: {generated}</p>
          {shared ? <p className="text-[10px] text-slate-400">শেয়ার করা লিংক</p> : null}
        </div>
      </header>

      {/* Party + period */}
      <section className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">পার্টি</p>
          <p className="mt-0.5 text-base font-semibold">{party.name}</p>
          <p className="text-[11px] text-slate-600">
            {typeLabel[party.type] || party.type}
            {party.phone ? ` · ${party.phone}` : ""}
          </p>
          {party.address ? <p className="max-w-xs text-[11px] leading-relaxed text-slate-500">{party.address}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">সময়কাল</p>
          <p className="mt-0.5 text-[12px]">
            {period?.from ? dateBD(period.from) : "শুরু"} — {period?.to ? dateBD(period.to) : "আজ"}
          </p>
          <p className="text-[11px] text-slate-500">মোট {statement.count}টি লেনদেন</p>
        </div>
      </section>

      {/* Summary strip */}
      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Opening পাওনা", value: taka(opening.receivable.due) },
          { label: "Opening দেনা", value: taka(opening.payable.due) },
          { label: "Closing পাওনা", value: taka(closing.receivable.due) },
          { label: "Closing দেনা", value: taka(closing.payable.due) },
        ].map((item) => (
          <div key={item.label} className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="num mt-0.5 text-[13px] font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Phone-friendly rows */}
      <section className="ledger-cards mt-4 space-y-2 sm:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div key={row._id} className="rounded border border-slate-200 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">{TX_LABELS[row.type] || row.type}</p>
                  <p className="text-[10px] text-slate-500">
                    {dateBD(row.date)} · {row.referenceNo}
                  </p>
                </div>
                <p
                  className={`num shrink-0 text-[12px] font-semibold ${
                    row.effect === "INCREASE" ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {row.effect === "INCREASE" ? "+" : "−"}
                  {taka(row.amount)}
                </p>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500">
                <span>পাওনা: <span className="num font-medium text-slate-700">{taka(row.running.receivable.due)}</span></span>
                <span>দেনা: <span className="num font-medium text-slate-700">{taka(row.running.payable.due)}</span></span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded border border-slate-200 px-2 py-4 text-center text-[11px] text-slate-500">
            এই সময়ে কোনো লেনদেন নেই।
          </p>
        )}
        <div className="flex items-center justify-between rounded border border-slate-900 px-2.5 py-2 text-[11px] font-semibold">
          <span>Closing Balance</span>
          <span className="num">
            পাওনা {taka(closing.receivable.due)} · দেনা {taka(closing.payable.due)}
          </span>
        </div>
      </section>

      {/* Ledger table */}
      <section className="ledger-table mt-4 hidden overflow-x-auto sm:block print:overflow-visible">
        <table className="w-full min-w-[560px] border-collapse text-[11px] print:min-w-0">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-2 py-2 text-left font-semibold">তারিখ</th>
              <th className="px-2 py-2 text-left font-semibold">রেফারেন্স</th>
              <th className="px-2 py-2 text-left font-semibold">বিবরণ</th>
              <th className="px-2 py-2 text-right font-semibold">পরিমাণ</th>
              <th className="px-2 py-2 text-right font-semibold">পাওনা বাকি</th>
              <th className="px-2 py-2 text-right font-semibold">দেনা বাকি</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <td className="px-2 py-1.5" colSpan={3}>
                <span className="font-semibold">Opening Balance</span>
                <span className="ml-1 text-slate-500">(পূর্বের হিসাব)</span>
              </td>
              <td className="px-2 py-1.5 text-right text-slate-400">—</td>
              <td className="num px-2 py-1.5 text-right font-medium">{taka(opening.receivable.due)}</td>
              <td className="num px-2 py-1.5 text-right font-medium">{taka(opening.payable.due)}</td>
            </tr>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row._id} className={index % 2 ? "bg-slate-50/60" : ""}>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">{dateBD(row.date)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-500">{row.referenceNo}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-medium">{TX_LABELS[row.type] || row.type}</span>
                    {row.note ? <span className="block truncate text-[10px] text-slate-500">{row.note}</span> : null}
                  </td>
                  <td className={`num px-2 py-1.5 text-right font-medium ${row.effect === "INCREASE" ? "text-rose-700" : "text-emerald-700"}`}>
                    {row.effect === "INCREASE" ? "+" : "−"}
                    {taka(row.amount)}
                  </td>
                  <td className="num px-2 py-1.5 text-right">{taka(row.running.receivable.due)}</td>
                  <td className="num px-2 py-1.5 text-right">{taka(row.running.payable.due)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                  এই সময়ে কোনো লেনদেন নেই।
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td colSpan={4} className="px-2 py-2 text-right font-semibold">
                Closing Balance
              </td>
              <td className="num px-2 py-2 text-right font-bold">{taka(closing.receivable.due)}</td>
              <td className="num px-2 py-2 text-right font-bold">{taka(closing.payable.due)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Footer */}
      <section className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-[10px] leading-relaxed text-slate-500">
          <p>
            এই স্টেটমেন্ট {company.companyName}-এর হিসাব বই থেকে তৈরি। মুদ্রা: {company.currency}{" "}
            ({company.currencySymbol})।
          </p>
          {advance > 0 ? <p className="mt-1 text-emerald-700">অগ্রিম / ক্রেডিট: {taka(advance)}</p> : null}
          <p className="mt-1">কোনো তথ্য ভুল মনে হলে দ্রুত যোগাযোগ করুন।</p>
        </div>
        <div className="w-40 shrink-0 text-center">
          <div className="border-b border-slate-400 pb-6" />
          <p className="mt-1 text-[10px] text-slate-500">অনুমোদিত স্বাক্ষর</p>
        </div>
      </section>
    </article>
  );
}
