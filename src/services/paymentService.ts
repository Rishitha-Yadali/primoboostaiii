import { SubscriptionPlan, Coupon, PaymentData, RazorpayOptions, RazorpayResponse, Subscription } from '../types/payment';
import { supabase } from '../lib/supabaseClient';

class PaymentService {
  // Get Razorpay key from environment variables
  private readonly RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_U7N6E8ot31tiej';

  // Updated subscription plans - Added 1-hour plan and removed yearly plan
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'hourly',
      name: 'Hourly Access',
      price: 19,
      duration: '1 Hour',
      optimizations: 3,
      features: [
        '3 Resume Optimizations',
        'ATS-Friendly Formatting',
        'Keyword Optimization',
        'PDF & Word Export',
        '1-Hour Access'
      ]
    },
    {
      id: 'daily',
      name: 'Per-Day Access',
      price: parseInt(import.meta.env.VITE_PLAN_DAILY_PRICE || '39'),
      duration: '1 Day',
      optimizations: parseInt(import.meta.env.VITE_PLAN_DAILY_OPTIMIZATIONS || '5'),
      features: [
        '5 Resume Optimizations',
        'ATS-Friendly Formatting',
        'Keyword Optimization',
        'PDF & Word Export',
        '24-Hour Access'
      ]
    },
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: parseInt(import.meta.env.VITE_PLAN_WEEKLY_PRICE || '129'),
      duration: '7 Days',
      optimizations: parseInt(import.meta.env.VITE_PLAN_WEEKLY_OPTIMIZATIONS || '25'),
      popular: true,
      features: [
        '25 Resume Optimizations',
        'ATS-Friendly Formatting',
        'Keyword Optimization',
        'PDF & Word Export',
        'Project Analysis',
        'Priority Support'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: parseInt(import.meta.env.VITE_PLAN_MONTHLY_PRICE || '349'),
      duration: '30 Days',
      optimizations: parseInt(import.meta.env.VITE_PLAN_MONTHLY_OPTIMIZATIONS || '100'),
      features: [
        '100 Resume Optimizations',
        'ATS-Friendly Formatting',
        'Keyword Optimization',
        'PDF & Word Export',
        'Project Analysis',
        'Priority Support',
        'Career Consultation'
      ]
    }
  ];

  // Updated coupon validation - includes hourly plan support
  private validateCouponCode(code: string, planId: string, amount: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const upperCode = code.toUpperCase().trim();
    
    // WORTHYONE - 50% off, one time per user, all plans
    if (upperCode === 'WORTHYONE') {
      return {
        valid: true,
        coupon: {
          code: 'WORTHYONE',
          discount: 50,
          type: 'percentage',
          description: 'Get 50% off - One time per user',
          validUntil: '2024-12-31'
        }
      };
    }
    
    // FULLSUPPORT - 100% off, only monthly plan, only 15 members, one time per user
    if (upperCode === 'FULLSUPPORT') {
      if (planId !== 'monthly') {
        return {
          valid: false,
          error: 'This coupon is only valid for Monthly Plan'
        };
      }

      return {
        valid: true,
        coupon: {
          code: 'FULLSUPPORT',
          discount: 100,
          type: 'percentage',
          description: 'Get 100% off Monthly Plan - Limited to 15 members',
          validUntil: '2024-12-31'
        }
      };
    }
    
    // FIRST100 - 100% off, only daily plan, one time per user
    if (upperCode === 'FIRST100') {
      if (planId !== 'daily') {
        return {
          valid: false,
          error: 'This coupon is only valid for Daily Plan'
        };
      }
      
      return {
        valid: true,
        coupon: {
          code: 'FIRST100',
          discount: 100,
          type: 'percentage',
          description: 'Get 100% off Daily Plan - One time per user',
          validUntil: '2024-12-31'
        }
      };
    }

    // QUICKSTART - 100% off, only hourly plan, one time per user
    if (upperCode === 'QUICKSTART') {
      if (planId !== 'hourly') {
        return {
          valid: false,
          error: 'This coupon is only valid for Hourly Plan'
        };
      }
      
      return {
        valid: true,
        coupon: {
          code: 'QUICKSTART',
          discount: 100,
          type: 'percentage',
          description: 'Get 100% off Hourly Plan - One time per user',
          validUntil: '2024-12-31'
        }
      };
    }
    
    // FREETRIAL - 100% off, only hourly plan, one time per user
    if (upperCode === 'FREETRIAL') {
      if (planId !== 'hourly') {
        return {
          valid: false,
          error: 'This coupon is only valid for Hourly Plan'
        };
      }
      
      return {
        valid: true,
        coupon: {
          code: 'FREETRIAL',
          discount: 100,
          type: 'percentage',
          description: 'Free 1-hour trial - One time use only',
          validUntil: '2025-12-31'
        }
      };
    }
    
    return {
      valid: false,
      error: 'Invalid coupon code'
    };
  }

  // Load Razorpay script
  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Get all subscription plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  // Get plan by ID
  getPlanById(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Validate coupon (now uses hidden validation)
  validateCoupon(code: string, amount: number, planId?: string): { valid: boolean; coupon?: Coupon; error?: string } {
    if (!code || !code.trim()) {
      return { valid: false, error: 'Please enter a coupon code' };
    }

    if (!planId) {
      return { valid: false, error: 'Plan selection required' };
    }

    return this.validateCouponCode(code, planId, amount);
  }

  // Calculate discount amount
  calculateDiscount(amount: number, coupon: Coupon): number {
    if (coupon.type === 'percentage') {
      const discount = (amount * coupon.discount) / 100;
      return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    } else {
      return Math.min(coupon.discount, amount);
    }
  }

  // Check IP restriction for multiple account creation
  async checkIpRestriction(userId: string): Promise<{ blocked: boolean; reason?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/check-ip-restriction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to check IP restriction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking IP restriction:', error);
      // Default to not blocked if there's an error checking
      return { blocked: false };
    }
  }

  // Create free subscription (for 100% discount coupons)
  async createFreeSubscription(
    planId: string,
    userId: string,
    couponCode?: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Check if user has already used this coupon
      if (couponCode === 'FREETRIAL') {
        const { data: existingSubscriptions, error: checkError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('coupon_used', 'FREETRIAL');
        
        if (checkError) {
          console.error('Error checking previous coupon usage:', checkError);
          throw new Error('Failed to validate coupon eligibility');
        }
        
        if (existingSubscriptions && existingSubscriptions.length > 0) {
          throw new Error('You have already used the FREETRIAL coupon. This is a one-time offer only.');
        }
        
        // Check for IP address reuse (would be implemented in backend)
        // This is a placeholder for the actual implementation
        console.log('Checking IP address for previous FREETRIAL usage...');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-free-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          couponCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create free subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating free subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create subscription' };
    }
  }

  // Create Razorpay order via backend
  private async createOrder(planId: string, couponCode?: string): Promise<{ orderId: string; amount: number; keyId: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          couponCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment via backend
  private async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Payment verification failed' };
    }
  }

  // Process payment
  async processPayment(
    paymentData: PaymentData,
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      // Load Razorpay script
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order via backend
      const orderData = await this.createOrder(paymentData.planId, paymentData.couponCode);

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount * 100, // Convert to paise
          currency: paymentData.currency,
          name: 'Resume Optimizer',
          description: `Subscription for ${this.getPlanById(paymentData.planId)?.name}`,
          order_id: orderData.orderId,
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment via backend
              const verificationResult = await this.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              
              resolve(verificationResult);
            } catch (error) {
              console.error('Error verifying payment:', error);
              resolve({ success: false, error: 'Payment verification failed' });
            }
          },
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment cancelled by user' });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
    }
  }

  // Get user's active subscription from Supabase
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting subscription:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        optimizationsUsed: data.optimizations_used,
        optimizationsTotal: data.optimizations_total,
        paymentId: data.payment_id,
        couponUsed: data.coupon_used
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Use optimization (decrement count) - simplified version without RPC
  async useOptimization(userId: string): Promise<{ success: boolean; remaining: number }> {
    try {
      // Get active subscription
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { success: false, remaining: 0 };
      }

      const remaining = subscription.optimizationsTotal - subscription.optimizationsUsed;
      
      if (remaining <= 0) {
        return { success: false, remaining: 0 };
      }

      // Update optimization count
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          optimizations_used: subscription.optimizationsUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) {
        console.error('Error using optimization:', error);
        return { success: false, remaining: 0 };
      }

      return { success: true, remaining: remaining - 1 };
    } catch (error) {
      console.error('Error using optimization:', error);
      return { success: false, remaining: 0 };
    }
  }

  // Check if user can optimize - simplified version without RPC
  async canOptimize(userId: string): Promise<{ canOptimize: boolean; remaining: number; subscription?: Subscription }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { canOptimize: false, remaining: 0 };
      }

      const remaining = subscription.optimizationsTotal - subscription.optimizationsUsed;
      
      return { 
        canOptimize: remaining > 0, 
        remaining,
        subscription
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { canOptimize: false, remaining: 0 };
    }
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting subscription history:', error);
        return [];
      }

      return data.map(sub => ({
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        optimizationsUsed: sub.optimizations_used,
        optimizationsTotal: sub.optimizations_total,
        paymentId: sub.payment_id,
        couponUsed: sub.coupon_used
      }));
    } catch (error) {
      console.error('Error getting subscription history:', error);
      return [];
    }
  }

  // Get payment transactions
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting payment history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error cancelling subscription:', error);
        return { success: false, error: 'Failed to cancel subscription' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }
}

export const paymentService = new PaymentService();