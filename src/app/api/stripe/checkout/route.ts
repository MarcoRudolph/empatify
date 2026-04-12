import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "You must be logged in to upgrade.", status: 401 } },
        { status: 401 }
      );
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found in database.", status: 404 } },
        { status: 404 }
      );
    }

    let stripeCustomerId = dbUser.stripeCustomerId;

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: dbUser.name || undefined,
        metadata: {
          supabase_user_id: dbUser.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, dbUser.id));
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get("origin") || "http://localhost:3000");

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        supabase_user_id: dbUser.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: { code: "STRIPE_ERROR", message: "Failed to create checkout session.", status: 500 } },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message || "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
}
