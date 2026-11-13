import { Settings } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";

export type CompanySettings = {
  companyName: string;
  address: string;
  phone: string;
  currency: string;
  currencySymbol: string;
};

/** Company details printed at the top of every document (statement, report, invoice). */
export async function getCompanySettings(): Promise<CompanySettings> {
  await connectDB();
  const doc = await Settings.findOne({}).lean();
  return {
    companyName: doc?.companyName || "Party Accounts",
    address: doc?.address || "",
    phone: doc?.phone || "",
    currency: doc?.currency || "BDT",
    currencySymbol: doc?.currencySymbol || "৳",
  };
}
