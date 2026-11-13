import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getLedgerStatement } from "@/lib/ledger";
import { getCompanySettings } from "@/lib/settings";
import { LedgerDocument } from "@/components/ledger-document";
import { PrintToolbar } from "@/components/print-toolbar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Statement — PDF" };

export default async function PrintLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ partyId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { partyId } = await params;
  const sp = await searchParams;
  const statement = await getLedgerStatement(partyId, { from: sp.from, to: sp.to });
  if (!statement) notFound();
  const company = await getCompanySettings();

  return (
    <main className="min-h-dvh bg-slate-100 pb-8 print:bg-white print:pb-0">
      <div className="mx-auto w-full max-w-[900px] px-3 print:max-w-none print:px-0">
        <PrintToolbar title={`${statement.party.name} — Statement`} />
        <LedgerDocument
          statement={statement}
          company={company}
          period={{ from: sp.from, to: sp.to }}
        />
      </div>
    </main>
  );
}
