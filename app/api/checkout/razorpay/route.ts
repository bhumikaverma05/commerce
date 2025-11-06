import { createOrder } from 'lib/payments/razorpay';
import { getCart } from 'lib/shopify';

export async function POST() {
  try {
    const cart = await getCart();

    if (!cart || cart.lines.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const amountFloat = Number(cart.cost.totalAmount.amount || '0');
    // Razorpay expects amount in smallest currency unit, e.g. paise for INR
    const amount = Math.round(amountFloat * 100);
    const currency = cart.cost.totalAmount.currencyCode || 'INR';

    const razorpayOrder = await createOrder({ amount, currency, receipt: `cart_${cart.id}` });

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        amount,
        currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
