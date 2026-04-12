---
name: stripe
description: "Stripe API interaction via MCP"
type: "mcp-stdio"
---

# Stripe MCP Skill

This skill allows interacting with the Stripe API using the `@stripe/mcp` server via `mcp2cli`.

## Connection

```bash
# Base command for Stripe MCP
export STRIPE_BASE="uvx mcp2cli --mcp-stdio \"npx -y @stripe/mcp --api-key=\$STRIPE_SECRET_KEY\""
```

## Tools

To list available tools:
```bash
eval "$STRIPE_BASE --list"
```

## Common Workflows

### Customers
- **Create a customer**: `eval "$STRIPE_BASE customer_create --email 'user@example.com'"`
- **List customers**: `eval "$STRIPE_BASE customer_list"`

### Subscriptions
- **List subscriptions**: `eval "$STRIPE_BASE subscription_list"`

### Checkout
- **Create a checkout session**: `eval "$STRIPE_BASE checkout_session_create --success_url 'https://example.com/success' --cancel_url 'https://example.com/cancel' --line_items '[{\"price\": \"PRICE_ID\", \"quantity\": 1}]' --mode 'subscription'"`
