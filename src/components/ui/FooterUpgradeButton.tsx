"use client"

import { useState, useEffect } from "react"
import { UpgradeModal } from "./UpgradeModal"
import { createClient } from "@/lib/supabase/client"

export function FooterUpgradeButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkUser()
  }, [])

  if (!isLoggedIn) return null

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
