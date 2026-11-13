"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      closeButton
      richColors
      duration={3200}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-border !bg-card !text-foreground !shadow-lift !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
