declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export class RazorpayService {
  private static instance: RazorpayService;
  private isScriptLoaded = false;

  private constructor() {}

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  async loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isScriptLoaded) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  async createOrder(amount: number, receipt?: string): Promise<PaymentOrder> {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: receipt || `receipt_${Date.now()}`,
          notes: {
            source: 'fusionforge_website'
          }
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  async verifyPayment(paymentResponse: RazorpayResponse): Promise<boolean> {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentResponse),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async openCheckout(options: RazorpayOptions): Promise<void> {
    const isLoaded = await this.loadScript();
    
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay is not available');
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
}

export const razorpayService = RazorpayService.getInstance();