import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
    }

    const { avatarUrl } = await request.json()

    if (!avatarUrl) {
      return NextResponse.json({ error: { message: "Avatar URL is required" } }, { status: 400 })
    }

    // 1. Update database record
    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, user.id))

    // 2. Update Auth Metadata
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating avatar:", error)
    return NextResponse.json(
      { error: { message: error.message || "Internal Server Error" } },
      { status: 500 }
    )
  }
}
