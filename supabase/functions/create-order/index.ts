import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
  planId: string
  couponCode?: string
}

interface PlanConfig {
  id: string
  name: string
  price: number
  duration: string
  optimizations: number
}

const plans: PlanConfig[] = [
  {
    id: 'hourly',
    name: 'Hourly Access',
    price: 19,
    duration: '1 Hour',
    optimizations: 3
  },
  {
    id: 'daily',
    name: 'Per-Day Access',
    price: 39,
    duration: '1 Day',
    optimizations: 5
  },
  {
    id: 'weekly',
    name: 'Weekly Plan',
    price: 129,
    duration: '7 Days',
    optimizations: 25
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 349,
    duration: '30 Days',
    optimizations: 100
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planId, couponCode }: OrderRequest = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get plan details
    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan selected')
    }

    // Calculate final amount with coupon
    let finalAmount = plan.price
    let discountAmount = 0

    if (couponCode) {
      const upperCode = couponCode.toUpperCase().trim()
      
      // Apply coupon logic
      if (upperCode === 'WORTHYONE') {
        discountAmount = Math.floor(plan.price * 0.5) // 50% off
      } else if (upperCode === 'FULLSUPPORT' && planId === 'monthly') {
        discountAmount = plan.price // 100% off monthly plan
      } else if (upperCode === 'FIRST100' && planId === 'daily') {
        discountAmount = plan.price // 100% off daily plan
      } else if (upperCode === 'QUICKSTART' && planId === 'hourly') {
        discountAmount = plan.price // 100% off hourly plan
      } else if (upperCode === 'FREETRIAL' && planId === 'hourly') {
        // Check if user has already used FREETRIAL
        const { data: existingSubscriptions, error: checkError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('coupon_used', 'FREETRIAL');
        
        if (checkError) {
          console.error('Error checking previous coupon usage:', checkError);
          throw new Error('Failed to validate coupon eligibility');
        }
        
        if (existingSubscriptions && existingSubscriptions.length > 0) {
          throw new Error('You have already used the FREETRIAL coupon. This is a one-time offer only.');
        }
        
        // Get client IP address for tracking
        const clientIp = req.headers.get('x-forwarded-for') || 
                        req.headers.get('x-real-ip') || 
                        'unknown';
        
        // Check if this IP has been used for FREETRIAL before
        const { data: ipUsage, error: ipCheckError } = await supabase
          .from('ip_coupon_usage')
          .select('id')
          .eq('ip_address', clientIp)
          .eq('coupon_code', 'FREETRIAL');
        
        if (!ipCheckError && ipUsage && ipUsage.length > 0) {
          throw new Error('This coupon has already been used from your network. Each network can only use this offer once.');
        }
        
        discountAmount = plan.price // 100% off hourly plan
      }
      
      finalAmount = Math.max(0, plan.price - discountAmount)
    }

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    const orderData = {
      amount: finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId,
        planName: plan.name,
        originalAmount: plan.price,
        discountAmount: discountAmount,
        couponCode: couponCode || '',
      }
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Razorpay API error:', errorText)
      throw new Error('Failed to create payment order')
    }

    const order = await response.json()

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: finalAmount,
        keyId: razorpayKeyId,
        currency: 'INR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})