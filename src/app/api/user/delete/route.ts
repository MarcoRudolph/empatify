import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * DELETE /api/user/delete
 * Deletes the authenticated user's account from Supabase Auth
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Delete user from Supabase Auth using Admin API
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY in environment variables
    const { createClient: createAdminClient } = await import("@supabase/supabase-js")
    
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error("Error deleting user:", deleteError)
      return NextResponse.json(
        {
          error: {
            code: "DELETE_ERROR",
            message: "Failed to delete user account",
            status: 500,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "User account deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Unexpected error deleting user:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

