import { type NextRequest } from "next/server"
import { GET as redirectHandler } from "../../redirect/route"

export async function GET(request: NextRequest) {
  return redirectHandler(request)
}
