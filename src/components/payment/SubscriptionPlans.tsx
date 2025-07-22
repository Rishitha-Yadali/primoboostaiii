import React, { useState, useRef, useEffect } from 'react';
import { Check, Star, Zap, Crown, Clock, X, Tag, Sparkles, Percent, ArrowRight, Info, ChevronLeft, ChevronRight, AlertTriangle, Gift, Timer } from 'lucide-react';
import { SubscriptionPlan, Coupon } from '../../types/payment';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionPlansProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  isOpen, 
  onClose, 
  onSubscriptionSuccess 
}) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('weekly'); // Default to weekly plan
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1); // Start with weekly plan (index 1)
  const carouselRef = useRef<HTMLDivElement>(null);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);

  const plans = paymentService.getPlans();

  // Set initial selected plan to the current slide
  useEffect(() => {
    if (plans.length > 0) {
      setSelectedPlan(plans[currentSlide]?.id || 'weekly');
    }
  }, [currentSlide, plans]);

  // Check if user has already used FREETRIAL coupon
  useEffect(() => {
    const checkFreeTrialUsage = async () => {
      if (user) {
        try {
          const subscriptionHistory = await paymentService.getSubscriptionHistory(user.id);
          const hasUsedFreeTrial = subscriptionHistory.some(sub => 
            sub.couponUsed === 'FREETRIAL'
          );
          setFreeTrialUsed(hasUsedFreeTrial);
        } catch (error) {
          console.error('Error checking free trial usage:', error);
        }
      }
    };
    
    if (isOpen) {
      checkFreeTrialUsage();
    }
  }, [user, isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'hourly': return <Timer className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'daily': return <Clock className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'weekly': return <Zap className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'monthly': return <Star className="w-5 h-5 sm:w-6 sm:h-6" />;
      default: return <Star className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'hourly': return 'from-purple-500 to-indigo-500';
      case 'daily': return 'from-blue-500 to-cyan-500';
      case 'weekly': return 'from-green-500 to-emerald-500';
      case 'monthly': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanTag = (planId: string) => {
    switch (planId) {
      case 'hourly': return 'Quick Test';
      case 'daily': return 'Quick Start';
      case 'weekly': return 'Most Popular';
      case 'monthly': return 'Best Value';
      default: return '';
    }
  };

  const getPlanTagColor = (planId: string) => {
    switch (planId) {
      case 'hourly': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'daily': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'weekly': return 'bg-green-100 text-green-700 border-green-200';
      case 'monthly': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % plans.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + plans.length) % plans.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return;

    // Special handling for FREETRIAL coupon
    if (couponCode.toUpperCase() === 'FREETRIAL') {
      if (selectedPlan !== 'hourly') {
        setCouponError('FREETRIAL coupon is only valid for the 1-Hour Plan');
        setAppliedCoupon(null);
        return;
      }
      
      if (freeTrialUsed) {
        setCouponError('You have already used the FREETRIAL coupon. This is a one-time offer only.');
        setAppliedCoupon(null);
        return;
      }
    }

    // Use the hidden validation from paymentService
    const validation = paymentService.validateCoupon(couponCode.trim(), selectedPlanData.price, selectedPlan);
    
    if (!validation.valid) {
      setCouponError(validation.error || 'Invalid coupon code');
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(validation.coupon!);
    setCouponError('');
    setShowCouponInput(false);
    
    // Show success message
    console.log(`✅ Coupon "${validation.coupon!.code}" applied successfully!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateFinalAmount = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return 0;

    let amount = plan.price;
    
    if (appliedCoupon) {
      const discount = paymentService.calculateDiscount(amount, appliedCoupon);
      amount = Math.max(0, amount - discount);
    }

    return amount;
  };

  const getDiscountAmount = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan || !appliedCoupon) return 0;

    return paymentService.calculateDiscount(plan.price, appliedCoupon);
  };

  const handlePayment = async () => {
    if (!user) return;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsProcessing(true);

    try {
      const finalAmount = calculateFinalAmount();
      const discountAmount = getDiscountAmount();

      console.log('💳 Payment Details:', {
        plan: plan.name,
        originalPrice: plan.price,
        coupon: appliedCoupon?.code,
        discount: discountAmount,
        finalAmount: finalAmount
      });

      // If final amount is 0 (100% discount), create subscription directly without payment
      if (finalAmount === 0) {
        const result = await paymentService.createFreeSubscription(
          selectedPlan,
          user.id,
          appliedCoupon?.code
        );

        if (result.success) {
          onClose();
          onSubscriptionSuccess();
        } else {
          alert(result.error || 'Failed to create subscription. Please try again.');
        }
      } else {
        // Process normal payment with discount applied
        const paymentData = {
          planId: selectedPlan,
          amount: plan.price,
          currency: 'INR',
          couponCode: appliedCoupon?.code,
          discountAmount,
          finalAmount
        };

        const result = await paymentService.processPayment(
          paymentData,
          user.email,
          user.name
        );

        if (result.success) {
          onClose();
          onSubscriptionSuccess();
        } else {
          alert(result.error || 'Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const finalAmount = calculateFinalAmount();
  const isFree = finalAmount === 0;
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-3 sm:px-6 py-4 sm:py-8 border-b border-gray-100">
          <button
            onClick={handleCloseClick}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="text-center max-w-4xl mx-auto px-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg">
              <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Resume Optimizer Plans
            </h1>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-600 mb-3 sm:mb-6">
              Professional AI-powered resume optimization with secure payment
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-8 overflow-y-auto flex-1 min-h-0">
          {/* Mobile Carousel (visible on mobile) */}
          <div className="block md:hidden mb-4 sm:mb-8">
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-xl sm:rounded-3xl">
                <div 
                  ref={carouselRef}
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {plans.map((plan, index) => (
                    <div key={plan.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                      <div
                        className={`relative rounded-xl sm:rounded-3xl border-2 transition-all duration-300 ${
                          index === currentSlide
                            ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-100'
                            : 'border-gray-200'
                        } ${plan.id === 'weekly' ? 'ring-2 ring-green-500 ring-offset-4' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2 sm:-top-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs font-bold shadow-lg">
                              Most Popular
                            </span>
                          </div>
                        )}

                        {/* Special Badge for Hourly Plan */}
                        {plan.id === 'hourly' && (
                          <div className="absolute -top-2 sm:-top-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                              Try Free with FREETRIAL
                            </span>
                          </div>
                        )}

                        <div className="p-3 sm:p-6">
                          {/* Plan Header */}
                          <div className="text-center mb-3 sm:mb-6">
                            <div className={`bg-gradient-to-r ${getPlanGradient(plan.id)} w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 text-white shadow-lg`}>
                              {getPlanIcon(plan.id)}
                            </div>
                            
                            {/* Plan Tag */}
                            <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border mb-2 sm:mb-3 ${getPlanTagColor(plan.id)}`}>
                              <Tag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {getPlanTag(plan.id)}
                            </div>
                            
                            <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            
                            <div className="text-center mb-2 sm:mb-4">
                              {plan.originalPrice && (
                                <span className="text-sm sm:text-lg text-gray-400 line-through mr-2">₹{plan.originalPrice}</span>
                              )}
                              <span className="text-xl sm:text-3xl font-bold text-gray-900">₹{plan.price}</span>
                              <span className="text-gray-600 ml-1 text-xs sm:text-base">/{plan.duration.toLowerCase()}</span>
                            </div>
                          </div>

                          {/* Optimizations Count */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-2xl p-2 sm:p-4 text-center mb-3 sm:mb-6">
                            <div className="text-lg sm:text-2xl font-bold text-indigo-600">{plan.optimizations}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Resume Optimizations</div>
                          </div>

                          {/* Features */}
                          <ul className="space-y-1 sm:space-y-3 mb-3 sm:mb-6 max-h-32 sm:max-h-none overflow-y-auto sm:overflow-visible">
                            {plan.features.slice(0, 4).map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start">
                                <Check className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 text-xs sm:text-sm break-words">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center space-x-2 mt-3 sm:mt-6">
                {plans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 min-w-[20px] min-h-[20px] ${
                      index === currentSlide
                        ? 'bg-indigo-600 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid (hidden on mobile) */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-4 lg:mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl lg:rounded-3xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedPlan === plan.id
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-100'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
                } ${plan.popular ? 'ring-2 ring-green-500 ring-offset-4' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 lg:px-6 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Special Badge for Hourly Plan */}
                {plan.id === 'hourly' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                      Try Free
                    </span>
                  </div>
                )}

                <div className="p-3 lg:p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-3 lg:mb-6">
                    <div className={`bg-gradient-to-r ${getPlanGradient(plan.id)} w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-4 text-white shadow-lg`}>
                      {getPlanIcon(plan.id)}
                    </div>
                    
                    {/* Plan Tag */}
                    <div className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium border mb-1 lg:mb-3 ${getPlanTagColor(plan.id)}`}>
                      <Tag className="w-2 h-2 lg:w-3 lg:h-3 mr-1" />
                      {getPlanTag(plan.id)}
                    </div>
                    
                    <h3 className="text-sm lg:text-xl font-bold text-gray-900 mb-2 break-words">{plan.name}</h3>
                    
                    <div className="text-center mb-2 lg:mb-4">
                      {plan.originalPrice && (
                        <span className="text-sm lg:text-lg text-gray-400 line-through mr-1">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-lg lg:text-3xl font-bold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-600 ml-1 text-xs lg:text-base">/{plan.duration.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Optimizations Count */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg lg:rounded-2xl p-2 lg:p-4 text-center mb-3 lg:mb-6">
                    <div className="text-lg lg:text-2xl font-bold text-indigo-600">{plan.optimizations}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Resume Optimizations</div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1 lg:space-y-3 mb-3 lg:mb-6 max-h-24 lg:max-h-none overflow-y-auto lg:overflow-visible">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-3 h-3 lg:w-5 lg:h-5 text-emerald-500 mr-1 lg:mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-xs lg:text-sm break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <button
                    className={`w-full py-2 lg:py-3 px-2 lg:px-4 rounded-lg lg:rounded-xl font-semibold transition-all duration-300 text-xs lg:text-base min-h-[44px] ${
                      selectedPlan === plan.id
                        ? `bg-gradient-to-r ${getPlanGradient(plan.id)} text-white shadow-lg transform scale-105`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.id ? (
                      <span className="flex items-center justify-center">
                        <Check className="w-3 h-3 lg:w-5 lg:h-5 mr-1 lg:mr-2" />
                        Selected
                      </span>
                    ) : (
                      'Select Plan'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="max-w-2xl mx-auto mt-4 sm:mt-6">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg sm:rounded-2xl p-3 sm:p-6 mb-3 sm:mb-6 border border-gray-200">
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                Payment Summary
              </h3>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Selected Plan:</span>
                  <span className="font-semibold break-words text-right">{selectedPlanData?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Original Price:</span>
                  <span>₹{selectedPlanData?.price}</span>
                </div>

                {/* Enhanced Coupon Code Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      <h4 className="text-xs sm:text-base font-semibold text-gray-900">Apply Coupon Code</h4>
                    </div>
                    {!showCouponInput && !appliedCoupon && (
                      <button
                        onClick={() => setShowCouponInput(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-[44px] whitespace-nowrap"
                      >
                        Apply Coupon
                      </button>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="bg-green-100 border border-green-200 rounded-lg p-2 sm:p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <div className="bg-green-500 p-1 rounded-full flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-green-800 text-xs sm:text-sm break-words">
                              ✅ Coupon Applied: {appliedCoupon.code}
                            </div>
                            <div className="text-green-700 text-xs break-words">{appliedCoupon.description}</div>
                            <div className="text-green-800 font-medium text-xs break-words">
                              Discount: ₹{getDiscountAmount()} ({appliedCoupon.discount}% off)
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-green-600 hover:text-green-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {showCouponInput && !appliedCoupon && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm min-h-[44px]"
                        />
                        <button
                          onClick={applyCoupon}
                          className="w-full sm:w-auto px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors text-sm min-h-[44px]"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => setShowCouponInput(false)}
                          className="w-full sm:w-auto px-3 py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </div>
                      {couponError && (
                        <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200 break-words">
                          ❌ {couponError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-2 rounded-lg text-sm">
                    <span className="font-medium break-words">Discount ({appliedCoupon.code}):</span>
                    <span className="font-bold">-₹{getDiscountAmount()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-2 sm:pt-3 mt-3">
                  <div className="flex justify-between items-center text-base sm:text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className={`${isFree ? 'text-green-600' : 'text-indigo-600'}`}>
                      {isFree ? 'FREE' : `₹${finalAmount}`}
                    </span>
                  </div>
                  {isFree && (
                    <div className="text-center mt-2 sm:mt-3">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 break-words">
                        <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        🎉 Congratulations! You're getting this completely FREE!
                      </span>
                    </div>
                  )}
                  {appliedCoupon && !isFree && (
                    <div className="text-center mt-2 sm:mt-3">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Percent className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        {appliedCoupon.discount}% Discount Applied!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="text-center px-2 sm:px-0">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full max-w-md mx-auto py-3 sm:py-4 px-4 sm:px-8 rounded-lg sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 min-h-[44px] ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isFree
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                    <span className="break-words">{isFree ? 'Activating Free Membership...' : 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="break-words text-center">
                      {isFree 
                        ? '🎉 Claim Your FREE Membership Now!' 
                        : `Pay ₹${finalAmount} - Start Optimizing`
                      }
                    </span>
                    <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" />
                  </>
                )}
              </button>
              
              <p className="text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4 flex items-center justify-center break-words px-4">
                <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                <span className="break-words text-center">
                  {isFree 
                  ? '🎁 No payment required • Instant activation • Limited time offer' 
                  : 'Secure payment powered by Razorpay • 256-bit SSL encryption'
                  }
                </span>
              </p>

              {/* Free Trial Message */}
              {selectedPlan === 'hourly' && !appliedCoupon && !freeTrialUsed && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg sm:rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎁</div>
                    <div className="text-purple-800 font-bold text-sm sm:text-base mb-1 break-words">
                      Try for FREE with coupon code: FREETRIAL
                    </div>
                    <div className="text-purple-700 text-xs sm:text-sm break-words">
                      Get a 1-hour trial with 3 resume optimizations at no cost!
                    </div>
                    <button
                      onClick={() => {
                        setCouponCode('FREETRIAL');
                        setShowCouponInput(true);
                        applyCoupon();
                      }}
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg text-sm min-h-[44px]"
                    >
                      Apply FREETRIAL Coupon
                    </button>
                    <div className="text-purple-600 text-xs mt-2 break-words">
                      ⚡ One-time offer for new users only
                    </div>
                  </div>
                </div>
              )}

              {/* Free Trial Already Used Message */}
              {selectedPlan === 'hourly' && freeTrialUsed && (
                <div className="mt-3 sm:mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs sm:text-sm text-amber-800 text-center flex items-center justify-center break-words">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-amber-600 flex-shrink-0" />
                    <span className="break-words">You've already used your free trial. Consider our affordable plans for continued access.</span>
                  </div>
                </div>
              )}

              {/* Regular Coupon Success Message */}
              {appliedCoupon && !isFree && (
                <div className="mt-3 sm:mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs sm:text-sm text-green-800 text-center break-words">
                    <span className="break-words">🎉 Great! You're saving ₹{getDiscountAmount()} with coupon <strong>{appliedCoupon.code}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};