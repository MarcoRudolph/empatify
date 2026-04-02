import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "trial_expired" | "budget_exceeded" | "no_access" }

// ~$1 at gpt-4o-mini rates ($0.15/1M input tokens, ~12 tokens/call = ~6,666 calls)
const TOKEN_BUDGET = 6600
const TRIAL_DAYS = 28

export async function checkCategoryAccess(userId: string): Promise<AccessResult> {
  const [user] = await db
    .select({
      proPlan: users.proPlan,
      aiTrialStartedAt: users.aiTrialStartedAt,
      aiTokensUsed: users.aiTokensUsed,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return { allowed: false, reason: "no_access" }
  if (user.proPlan) return { allowed: true }

  // Start trial on first use
  if (!user.aiTrialStartedAt) {
    await db.update(users).set({ aiTrialStartedAt: new Date() }).where(eq(users.id, userId))
    return { allowed: true }
  }

  const expiry = new Date(user.aiTrialStartedAt)
  expiry.setDate(expiry.getDate() + TRIAL_DAYS)
  if (new Date() > expiry) return { allowed: false, reason: "trial_expired" }
  if (user.aiTokensUsed >= TOKEN_BUDGET) return { allowed: false, reason: "budget_exceeded" }

  return { allowed: true }
}

export async function recordTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  await db
    .update(users)
    .set({ aiTokensUsed: sql`${users.aiTokensUsed} + ${tokensUsed}` })
    .where(eq(users.id, userId))
}
