import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const tones = {
  primary: { chip: "bg-indigo-50 text-indigo-600 ring-indigo-100", value: "text-foreground" },
  success: { chip: "bg-emerald-50 text-emerald-600 ring-emerald-100", value: "text-emerald-700" },
  warning: { chip: "bg-amber-50 text-amber-600 ring-amber-100", value: "text-amber-700" },
  violet: { chip: "bg-violet-50 text-violet-600 ring-violet-100", value: "text-violet-700" },
  rose: { chip: "bg-rose-50 text-rose-600 ring-rose-100", value: "text-rose-700" },
} as const;

export type StatTone = keyof typeof tones;

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <Card className={cn("gap-0 p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg ring-1", t.chip)}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <p className={cn("num mt-3 text-[17px] font-semibold leading-snug tracking-tight sm:text-2xl", t.value)}>
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </Card>
  );
}
