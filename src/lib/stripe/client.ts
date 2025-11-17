import Stripe from 'stripe';

/**
 * Stripe client for handling Pro plan subscriptions
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

