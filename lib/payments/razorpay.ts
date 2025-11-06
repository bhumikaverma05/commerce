import crypto from 'crypto';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

export async function createOrder({
  amount,
  currency = 'INR',
  receipt = `rcpt_${Date.now()}`,
  payment_capture = 1
}: {
  amount: number; // amount in smallest currency unit (eg. paise)
  currency?: string;
  receipt?: string;
  payment_capture?: 0 | 1;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured.');
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    },
    body: JSON.stringify({ amount, currency, receipt, payment_capture })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order creation failed: ${res.status} ${text}`);
  }

  const body = await res.json();
  return body as { id: string; [k: string]: any };
}

export function verifyWebhookSignature(payload: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Razorpay webhook secret is not configured.');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  // Use constant-time compare to avoid timing attacks
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
