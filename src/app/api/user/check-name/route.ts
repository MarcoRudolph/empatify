import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"

/**
 * GET /api/user/check-name?name=...
 * Checks if a display name is already taken (excluding current user)
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const name = requestUrl.searchParams.get("name")

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Name parameter is required",
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    // Get current user's database ID
    const [currentDbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1)

    if (!currentDbUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found in database",
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Check if name is already taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.name, name.trim()),
          ne(users.id, currentDbUser.id) // Exclude current user
        )
      )
      .limit(1)

    return NextResponse.json(
      {
        available: existingUser.length === 0,
        taken: existingUser.length > 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error checking name:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to check name",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
