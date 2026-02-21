"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Variant: default (dark theme) or light (white bg, dark text for contrast) */
  variant?: "default" | "light"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-xl border text-base shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          variant === "default" && [
            "border-neutral-300 bg-neutral-200 text-neutral-900",
            "placeholder:text-neutral-500",
            "focus-visible:ring-offset-neutral-100",
          ],
          variant === "light" && [
            "border-neutral-300 bg-white text-[#0F0F0F]",
            "placeholder:text-[#6B6B6B]",
            "focus-visible:ring-offset-neutral-100",
            "caret-[#0F0F0F]",
          ],
          className
        )}
        ref={ref}
        data-variant={variant}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
