import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FreeSubscriptionRequest {
  planId: string
  userId: string
  couponCode?: string
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
    const { planId, userId, couponCode }: FreeSubscriptionRequest = await req.json()

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

    if (userError || !user || user.id !== userId) {
      throw new Error('Invalid user token')
    }

    // Get plan configuration
    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      throw new Error('Invalid plan')
    }

    // Validate that this is indeed a free subscription (100% discount)
    let isValidFreeCoupon = false
    if (couponCode) {
      const upperCode = couponCode.toUpperCase().trim()
      
      if (upperCode === 'FULLSUPPORT' && planId === 'monthly') {
        isValidFreeCoupon = true
      } else if (upperCode === 'FIRST100' && planId === 'daily') {
        isValidFreeCoupon = true
      } else if ((upperCode === 'QUICKSTART' || upperCode === 'FREETRIAL') && planId === 'hourly') {
        isValidFreeCoupon = true
      }
    }

    if (!isValidFreeCoupon) {
      throw new Error('Invalid coupon for free subscription')
    }

    // For FREETRIAL coupon, check if user has already used it
    if (couponCode?.toUpperCase() === 'FREETRIAL') {
      // Check if user has already used this coupon
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
      
      // Record IP usage
      await supabase
        .from('ip_coupon_usage')
        .insert({
          ip_address: clientIp,
          coupon_code: 'FREETRIAL',
          user_id: userId,
          used_at: new Date().toISOString()
        });
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (plan.durationInHours * 60 * 60 * 1000))

    // Create free subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        optimizations_used: 0,
        optimizations_total: plan.optimizations,
        payment_id: null, // No payment for free subscription
        coupon_used: couponCode
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Free subscription creation error:', subscriptionError)
      throw new Error('Failed to create free subscription')
    }

    // Create transaction record for free subscription
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        payment_id: `free_${Date.now()}`,
        order_id: `free_order_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        status: 'success',
        coupon_code: couponCode,
        discount_amount: plan.price * 100, // Full discount in paise
        final_amount: 0
      })

    if (transactionError) {
      console.error('Free transaction creation error:', transactionError)
      // Don't throw error here as subscription is already created
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        message: 'Free subscription created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Free subscription creation error:', error)
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