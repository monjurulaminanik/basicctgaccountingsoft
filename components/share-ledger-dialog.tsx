"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, RefreshCw, Share2, ShieldOff, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Share = { token: string; path: string; expiresAt: string | null; views: number };

/**
 * "Magic link" for a party statement: anyone holding the URL can read it without
 * logging in until it is revoked or expires.
 */
export function ShareLedgerDialog({
  partyId,
  partyName,
  disabled,
}: {
  partyId: string;
  partyName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = share ? `${typeof window !== "undefined" ? window.location.origin : ""}${share.path}` : "";

  useEffect(() => {
    if (!open || !partyId) return;
    setLoading(true);
    fetch(`/api/share/ledger?partyId=${partyId}`)
      .then((r) => r.json())
      .then((d) => setShare(d.share ?? null))
      .catch(() => setShare(null))
      .finally(() => setLoading(false));
  }, [open, partyId]);

  async function create(force = false) {
    setBusy(true);
    try {
      if (force && share) {
        await fetch(`/api/share/ledger/${share.token}`, { method: "DELETE" });
      }
      const r = await fetch("/api/share/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "লিংক তৈরি করা যায়নি");
      setShare(d.share);
      toast.success(d.reused ? "আগের লিংকটি ব্যবহার করা হচ্ছে" : "শেয়ার লিংক তৈরি হয়েছে");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!share) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/share/ledger/${share.token}`, { method: "DELETE" });
      if (!r.ok) throw new Error("লিংক বন্ধ করা যায়নি");
      setShare(null);
      toast.success("শেয়ার লিংক বন্ধ হয়েছে");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const expiry = share?.expiresAt
    ? new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(new Date(share.expiresAt))
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !partyId}>
          <Share2 className="size-4" /> শেয়ার
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>লেজার শেয়ার লিংক</DialogTitle>
          <DialogDescription>
            {partyName ? <span className="font-medium text-foreground">{partyName}</span> : "এই পার্টির"}{" "}
            স্টেটমেন্ট যে কেউ খুলতে পারবে — login লাগবে না, শুধু পড়া যাবে।
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : share ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-[12px]" />
              <Button onClick={copy} className="shrink-0">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "কপি" : "কপি"}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {expiry ? `মেয়াদ: ${expiry} পর্যন্ত` : "মেয়াদ নেই"} · {share.views} বার দেখা হয়েছে
            </p>
            <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
              <Button variant="outline" size="sm" onClick={() => create(true)} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw className="size-3.5" />} নতুন লিংক
              </Button>
              <Button variant="ghost" size="sm" onClick={revoke} disabled={busy} className="text-destructive">
                <ShieldOff className="size-3.5" /> লিংক বন্ধ করুন
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              এখনো কোনো শেয়ার লিংক নেই। লিংক তৈরি করলে যে কেউ এটি খুলে স্টেটমেন্ট দেখতে পারবে।
            </div>
            <Button onClick={() => create(false)} disabled={busy} className="w-full">
              {busy ? <Loader2 className="animate-spin" /> : <Link2 className="size-4" />} লিংক তৈরি করুন
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
