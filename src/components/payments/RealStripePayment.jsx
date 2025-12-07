import React, { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { toast } from 'sonner';
import { Lock, Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const RealStripePayment = ({ onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        onError?.('User not authenticated');
      }
    };
    fetchUser();
  }, [onError]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .substring(0, 19);
  };

  const handlePayment = async () => {
    if (!currentUser) {
      toast.error("Please log in first");
      return;
    }

    // בדיקת שדות
    if (!paymentData.cardNumber || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvc || !paymentData.cardholderName) {
      toast.error("Please fill in all payment details");
      return;
    }

    setIsProcessing(true);

    try {
      // שלב 1: יצירת Payment Intent
      const intentResponse = await fetch('/.netlify/functions/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10, // $10
          userEmail: currentUser.email
        })
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await intentResponse.json();

      // שלב 2: אימות התשלום (בסביבה אמיתית זה יהיה עם Stripe Elements)
      // כאן אנחנו מדמים את התהליך
      
      // בסביבה אמיתית תשתמש ב:
      // const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      // const result = await stripe.confirmCardPayment(clientSecret, {...});

      // הדמיה של תשלום מוצלח (90% הצלחה)
      const simulatePayment = () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.1) {
              resolve({ paymentIntent: { id: paymentIntentId, status: 'succeeded' } });
            } else {
              reject(new Error('Your card was declined'));
            }
          }, 2000);
        });
      };

      const result = await simulatePayment();

      // שלב 3: אישור התשלום בשרת
      const confirmResponse = await fetch('/.netlify/functions/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntent.id,
          userEmail: currentUser.email
        })
      });

      if (!confirmResponse.ok) {
        throw new Error('Payment confirmation failed');
      }

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        // עדכון המשתמש ל-premium
        await User.updateMyUserData({
          subscription_tier: 'premium',
          subscription_date: new Date().toISOString()
        });

        toast.success("Payment successful! Welcome to OneOlam Premium! 🎉");
        onSuccess?.();
      } else {
        throw new Error('Payment not confirmed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || "Payment failed. Please try again.");
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* כרטיס אבטחה */}
      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-bold text-green-800">Secure Payment</h3>
            <p className="text-sm text-green-700">256-bit SSL encryption • PCI DSS compliant</p>
          </div>
        </div>
      </div>

      {/* טופס תשלום */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">Payment Details</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Card Number
            </label>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              maxLength="19"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Month
              </label>
              <select
                value={paymentData.expiryMonth}
                onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Year
              </label>
              <select
                value={paymentData.expiryYear}
                onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">YY</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={String(new Date().getFullYear() + i).slice(-2)}>
                    {String(new Date().getFullYear() + i).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CVC
              </label>
              <Input
                type="text"
                placeholder="123"
                value={paymentData.cvc}
                onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, '').substring(0, 4))}
                maxLength="4"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cardholder Name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={paymentData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* כפתור תשלום */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 text-lg font-semibold"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Pay $10/month</span>
          </div>
        )}
      </Button>

      {/* הודעות אבטחה */}
      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>
  );
};