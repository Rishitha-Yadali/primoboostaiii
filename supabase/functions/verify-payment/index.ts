import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface PlanConfig {
  id: string
  name: string
  price: number
  duration: string
  optimizations: number
  durationInHours: number
}

const plans: PlanConfig[] = [
  {
    id: 'hourly',
    name: 'Hourly Access',
    price: 19,
    duration: '1 Hour',
    optimizations: 3,
    durationInHours: 1
  },
  {
    id: 'daily',
    name: 'Per-Day Access',
    price: 39,
    duration: '1 Day',
    optimizations: 5,
    durationInHours: 24
  },
  {
    id: 'weekly',
    name: 'Weekly Plan',
    price: 129,
    duration: '7 Days',
    optimizations: 25,
    durationInHours: 24 * 7
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 349,
    duration: '30 Days',
    optimizations: 100,
    durationInHours: 24 * 30
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: PaymentVerificationRequest = await req.json()

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

    // Verify payment signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured')
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature')
    }

    // Get order details from Razorpay
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order details')
    }

    const orderData = await orderResponse.json()
    const planId = orderData.notes.planId
    const couponCode = orderData.notes.couponCode || null

    // Get plan configuration
    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan')
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (plan.durationInHours * 60 * 60 * 1000))

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        optimizations_used: 0,
        optimizations_total: plan.optimizations,
        payment_id: razorpay_payment_id,
        coupon_used: couponCode
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      throw new Error('Failed to create subscription')
    }

    // Create payment transaction record
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'success',
        coupon_code: couponCode,
        discount_amount: parseInt(orderData.notes.discountAmount) || 0,
        final_amount: orderData.amount
      })

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      // Don't throw error here as subscription is already created
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        message: 'Payment verified and subscription created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})