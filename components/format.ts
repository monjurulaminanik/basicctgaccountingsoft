const money = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const moneyExact = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `৳৮,০০০` — one consistent shape everywhere instead of the locale's suffix form. */
export const taka = (value: number | undefined | null) => `৳${money.format(value || 0)}`;

/** Same as `taka` but always shows two decimals. */
export const takaExact = (value: number | undefined | null) => `৳${moneyExact.format(value || 0)}`;

export const dateBD = (value: string | Date) =>
  new Intl.DateTimeFormat("bn-BD", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
