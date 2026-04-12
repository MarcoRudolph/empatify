---
description: "Plan to integrate Stripe subscriptions for the Pro plan."
paths:
  - "./src/app/api/stripe/checkout/route.ts"
  - "./src/app/api/stripe/webhook/route.ts"
  - "./src/lib/db/schema.ts"
  - "./src/components/ui/UpgradeModal.tsx"
---

# Stripe Pro Plan Integration Plan (COMPLETED)

This plan outlines the steps to implement an autonomous Pro plan subscription flow using Stripe.

## Objective
Enable users to upgrade to the Pro plan via a Stripe Checkout Session and automatically update their status in the database via webhooks.

## Context
- **Stripe Price ID**: Provided by the user (`STRIPE_PRICE_ID`).
- **Database**: Supabase PostgreSQL managed with Drizzle ORM.
- **Redirects**: Success redirects to `/dashboard`, Cancel redirects back to the previous page or pricing section.

## Implementation Steps

### Phase 1: Establish Connection & Schema (Immediate)

- [x] **Step 1: Establish Stripe MCP Connection**
  Create a new skill `.cursor/skills/stripe/SKILL.md` to connect to the Stripe API via `mcp2cli`.
  
- [x] **Step 2: Database Migration**
  Modify `src/lib/db/schema.ts` to add Stripe-related columns:
  - `stripe_customer_id`: varchar
  - `stripe_subscription_id`: varchar
  Applied via `npx drizzle-kit push`.

### Phase 2: Backend API Routes

- [x] **Step 3: Create Checkout API Route**
  Implemented `src/app/api/stripe/checkout/route.ts`.
  - Verifies session.
  - Manages Stripe Customer.
  - Creates Checkout Session with `STRIPE_PRICE_ID`.

- [x] **Step 4: Create Webhook API Route**
  Implemented `src/app/api/stripe/webhook/route.ts`.
  - Verifies signature.
  - Handles `checkout.session.completed` and subscription events.

### Phase 3: Frontend Integration

- [x] **Step 5: Update Upgrade Modal**
  Modified `src/components/ui/UpgradeModal.tsx`.
  - Replaced `mailto:` with Stripe Checkout flow.
  - Added loading states and error handling.

## Verification & Testing
- **Test Mode**: Ready for testing with Stripe test cards.
- **Webhook Testing**: Requires `STRIPE_WEBHOOK_SECRET` from Stripe CLI (`stripe listen`).
- **DB Check**: `pro_plan` will be toggled by the webhook upon successful payment.
