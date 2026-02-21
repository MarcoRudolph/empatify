import { type NextRequest } from "next/server"
import { GET as authCallbackHandler } from "../../../auth/callback/route"

export async function GET(request: NextRequest) {
  return authCallbackHandler(request)
}
