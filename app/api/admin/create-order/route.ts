import { requireAdminAuth } from 'lib/auth';
import { getCart } from 'lib/shopify';
import { createShopifyOrderFromCart } from 'lib/shopify/admin';

export async function POST(request: Request) {
  try {
    try {
      requireAdminAuth(request);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const cart = await getCart();
    if (!cart) {
      return new Response(JSON.stringify({ error: 'Cart not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json().catch(() => ({}));

    const order = await createShopifyOrderFromCart(cart, body.payment);

    return new Response(JSON.stringify({ ok: true, order }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
