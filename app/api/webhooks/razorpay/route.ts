import { TAGS } from 'lib/constants';
import { verifyWebhookSignature } from 'lib/payments/razorpay';

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    let isValid = false;
    try {
      isValid = verifyWebhookSignature(raw, signature);
    } catch (e) {
      console.error('Webhook verification failed setup error', e);
      return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = JSON.parse(raw);

    // Example handling: payment.captured
    const event = payload.event || payload.event_type || '';

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      // If enabled, create a Shopify order after successful payment.
      const createOrderOnPayment = process.env.CREATE_SHOPIFY_ORDER_ON_PAYMENT === 'true';

      if (createOrderOnPayment) {
        try {
          // Create a Shopify order using the server-side cart and admin token.
          const { createShopifyOrderFromCart } = await import('lib/shopify/admin');
          const { getCart } = await import('lib/shopify');

          const cart = await getCart();
          if (cart) {
            // Provide payment info from the Razorpay payload when available.
            const payment = payload.payload?.payment?.entity || payload.payload?.payment || { id: payload.payload?.payment?.entity?.id };
            try {
              await createShopifyOrderFromCart(cart, { provider: 'razorpay', id: payment?.id, email: payment?.email });
            } catch (orderErr) {
              console.error('Error creating Shopify order after payment', orderErr);
            }
          }
        } catch (e) {
          console.warn('Shopify order creation not configured or failed', e);
        }
      }

      // Attempt to revalidate cart tag so storefront updates.
      try {
        const dynamicImport = new Function('return import("next/cache")');
        const mod = await dynamicImport();
        if (mod && typeof mod.revalidateTag === 'function') {
          try {
            mod.revalidateTag(TAGS.cart);
          } catch (err) {
            console.error('Error revalidating cache tags', err);
          }
        }
      } catch (e) {
        console.warn('Could not import next/cache to revalidate tags', e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
