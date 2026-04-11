import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", status: 401 } }, { status: 401 })

  const [dbUser] = await db
    .select({ proPlan: users.proPlan })
    .from(users)
    .where(eq(users.email, user.email!))
    .limit(1)

  if (!dbUser) return NextResponse.json({ error: { code: "USER_NOT_FOUND", status: 404 } }, { status: 404 })

  return NextResponse.json({ proPlan: dbUser.proPlan })
}
