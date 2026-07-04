"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "subtle";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-black font-medium hover:brightness-110 active:brightness-95 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset]",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  subtle: "bg-surface-2 text-fg border border-border hover:border-muted/40",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        VARIANTS[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
