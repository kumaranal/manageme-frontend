interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutInstance {
  open: () => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let loadPromise: Promise<void> | undefined;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = undefined;
        reject(new Error('Could not load Razorpay checkout'));
      };
      document.body.appendChild(script);
    });
  }
  return loadPromise;
}

// Opens the Razorpay Standard Checkout modal and resolves with the payment
// fields needed for server-side signature verification. Rejects if the user
// closes the modal without paying, so callers can distinguish cancel from error.
export async function openRazorpayCheckout(params: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
}): Promise<RazorpaySuccessResponse> {
  await loadScript();
  if (!window.Razorpay) throw new Error('Could not load Razorpay checkout');

  return new Promise((resolve, reject) => {
    const instance = new window.Razorpay!({
      key: params.keyId,
      order_id: params.orderId,
      amount: params.amount,
      currency: params.currency,
      name: params.name,
      description: params.description,
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('cancelled')) },
    });
    instance.open();
  });
}
