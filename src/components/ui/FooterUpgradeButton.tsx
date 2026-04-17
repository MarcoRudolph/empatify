"use client"

import { useState } from "react"
import { UpgradeModal } from "./UpgradeModal"

export function FooterUpgradeButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors duration-200 text-left"
      >
        {label}
      </button>
      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
