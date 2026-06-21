import Stripe from 'stripe';

/**
 * Stripe client for handling Pro plan subscriptions
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

