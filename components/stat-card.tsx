import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const tones = {
  primary: {
    card: "from-violet-500/12 via-indigo-500/8 to-transparent border-violet-200/70",
    chip: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_8px_18px_-8px_rgba(109,40,217,.9)]",
    label: "text-violet-700/80",
    value: "text-violet-950",
  },
  success: {
    card: "from-emerald-500/12 via-teal-500/8 to-transparent border-emerald-200/70",
    chip: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_8px_18px_-8px_rgba(13,148,136,.9)]",
    label: "text-emerald-700/80",
    value: "text-emerald-950",
  },
  warning: {
    card: "from-amber-500/14 via-orange-500/8 to-transparent border-amber-200/70",
    chip: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_8px_18px_-8px_rgba(234,154,11,.9)]",
    label: "text-amber-700/80",
    value: "text-amber-950",
  },
  violet: {
    card: "from-fuchsia-500/12 via-violet-500/8 to-transparent border-fuchsia-200/70",
    chip: "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-[0_8px_18px_-8px_rgba(192,38,211,.85)]",
    label: "text-fuchsia-700/80",
    value: "text-fuchsia-950",
  },
  rose: {
    card: "from-rose-500/12 via-pink-500/8 to-transparent border-rose-200/70",
    chip: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_8px_18px_-8px_rgba(225,29,72,.85)]",
    label: "text-rose-700/80",
    value: "text-rose-950",
  },
  cyan: {
    card: "from-cyan-500/12 via-sky-500/8 to-transparent border-cyan-200/70",
    chip: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-[0_8px_18px_-8px_rgba(6,182,212,.85)]",
    label: "text-cyan-700/80",
    value: "text-cyan-950",
  },
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
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-[0_1px_2px_rgba(76,29,149,.05),0_16px_38px_-24px_rgba(76,29,149,.5)] sm:p-5",
        t.card,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("pt-0.5 text-[13px] font-medium", t.label)}>{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", t.chip)}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <p className={cn("num mt-3 text-[17px] font-semibold leading-snug tracking-tight sm:text-2xl", t.value)}>
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}
