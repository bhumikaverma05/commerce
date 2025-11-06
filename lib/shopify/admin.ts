import { Cart } from '../shopify/types';

const SHOPIFY_API_VERSION = '2023-10';

export async function createShopifyOrderFromCart(
  cart: Cart,
  payment?: { provider?: string; id?: string; email?: string }
) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;

  if (!domain || !token) {
    throw new Error('Shopify admin credentials are not configured.');
  }

  // Build simple line_items using title/quantity/price. If variant IDs are available
  // they should be used instead. This approach creates non-variant line items if mapping
  // is not possible.
  const line_items = cart.lines.map((line) => {
    const price = Number(line.cost.totalAmount.amount) / line.quantity;
    const item: any = {
      name: line.merchandise.product.title,
      quantity: line.quantity,
      price: price.toString()
    };

    // If a variant id is available and looks numeric, use it as variant_id.
    // Many storefront IDs are GIDs; mapping may be required for exact variant matching.
    try {
      const maybeId = line.merchandise.id;
      if (maybeId && typeof maybeId === 'string') {
        const numeric = maybeId.match(/(\d+)/);
        if (numeric) {
          item.variant_id = Number(numeric[1]);
        }
      }
    } catch (e) {
      // ignore mapping errors and continue with name-based item
    }

    return item;
  });

  const orderPayload: any = {
    order: {
      line_items,
      financial_status: payment ? 'paid' : 'pending'
    }
  };

  if (payment?.email) {
    orderPayload.order.email = payment.email;
  }

  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(orderPayload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify order creation failed: ${res.status} ${text}`);
  }

  const body = await res.json();
  return body;
}
