import { getPartyBalances } from "@/lib/accounting";
import { Party } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";

export type PartyBalanceRow = {
  party: { _id: string; name: string; phone?: string; type: string; address?: string };
  balances: {
    receivable: { due: number; advance: number; raw: number };
    payable: { due: number; advance: number; raw: number };
  };
};

/** Party balance summary shared by the reports screen and its printable version. */
export async function getPartyBalanceRows(): Promise<PartyBalanceRow[]> {
  await connectDB();
  const parties = await Party.find({ active: true }).sort({ name: 1 }).lean();
  return Promise.all(
    parties.map(async (party) => ({
      party: {
        _id: String(party._id),
        name: party.name,
        phone: party.phone || "",
        type: party.type,
        address: party.address || "",
      },
      balances: await getPartyBalances(party._id.toString(), party.openingReceivable, party.openingPayable),
    }))
  );
}
