import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold outline-none transition-all select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 text-white shadow-[0_8px_20px_-10px_rgba(109,40,217,.9)] hover:from-violet-500 hover:via-indigo-500 hover:to-indigo-400 active:scale-[0.99]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.99]",
        outline:
          "border border-input bg-white/80 text-foreground shadow-xs backdrop-blur hover:border-violet-300 hover:bg-violet-50/70 hover:text-violet-900",
        ghost: "text-foreground hover:bg-violet-50 hover:text-violet-900",
        destructive:
          "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_8px_20px_-10px_rgba(225,29,72,.9)] hover:from-rose-500 hover:to-pink-500",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-md px-3 text-[13px]",
        lg: "h-11 rounded-lg px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-9 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
