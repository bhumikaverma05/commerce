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
      // We can optionally create a Shopify order here if desired (requires Admin API token)
      // For now, attempt to revalidate cart tag so storefront updates.
      try {
        // Import via Function to avoid static analysis/type errors in environments
        // where `next/cache` types aren't available during edit-time.
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
        // If import fails (eg. in test environment), log and continue
        console.warn('Could not import next/cache to revalidate tags', e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
