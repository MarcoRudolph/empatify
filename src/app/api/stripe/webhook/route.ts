import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.metadata?.supabase_user_id;
        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        if (supabaseUserId) {
          await db
            .update(users)
            .set({ 
              proPlan: true,
              stripeSubscriptionId,
              stripeCustomerId
            })
            .where(eq(users.id, supabaseUserId));
          console.log(`User ${supabaseUserId} upgraded to Pro plan via checkout.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        await db
          .update(users)
          .set({ proPlan: false, stripeSubscriptionId: null })
          .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
        console.log(`Subscription ${stripeSubscriptionId} deleted. User downgraded from Pro plan.`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;
        
        // Handle cancellation or other status changes if needed
        if (subscription.status === "active") {
           await db
            .update(users)
            .set({ proPlan: true })
            .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
        } else if (["canceled", "incomplete_expired", "unpaid"].includes(subscription.status)) {
           await db
            .update(users)
            .set({ proPlan: false })
            .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Handler Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
