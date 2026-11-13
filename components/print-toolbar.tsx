"use client";

import { useRouter } from "next/navigation";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Floating toolbar for printable documents. Hidden from the printed page, so the
 * PDF only contains the document itself.
 */
export function PrintToolbar({
  title,
  shareUrl,
  shareLabel = "লিংক কপি",
}: {
  title: string;
  shareUrl?: string;
  shareLabel?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="sticky top-0 z-20 -mb-2 mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-3 py-2.5 backdrop-blur print:hidden sm:px-4">
      <p className="mr-auto min-w-0 truncate text-[13px] font-semibold text-slate-700">{title}</p>
      {shareUrl ? (
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "কপি হয়েছে" : shareLabel}
        </Button>
      ) : null}
      <Button size="sm" onClick={() => window.print()}>
        <Download className="size-4" /> PDF / প্রিন্ট
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="বন্ধ করুন" onClick={() => router.back()}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

export function MobileShareHint() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Share2 className="size-3" /> যেকোনো ব্রাউজারে খুলবে
    </p>
  );
}
