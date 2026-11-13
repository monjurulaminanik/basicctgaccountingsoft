"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Opens the browser print dialog, where "Save as PDF" produces the document. */
export function PrintButton({ label = "PDF", className }: { label?: string; className?: string }) {
  return (
    <Button size="sm" className={className} onClick={() => window.print()}>
      <Download className="size-4" /> {label}
    </Button>
  );
}
