import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { User } from '@/entities/all';
import { Lock, Loader2 } from 'lucide-react';

// טוען את Stripe (החלף במפתח הציבורי האמיתי שלך)
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');

const CheckoutForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        onError('User not authenticated');
      }
    };
    fetchUser();
  }, [onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !currentUser) {
      return;
    }

    setIsProcessing(true);

    try {
      // שלב 1: יצירת Payment Intent בצד השרת
      const response = await fetch('/.netlify/functions/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: 10, // $10
          userEmail: currentUser.email 
        })
      });

      const { clientSecret } = await response.json();

      // שלב 2: אישור התשלום עם Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: currentUser.full_name,
            email: currentUser.email,
          },
        }
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        // שלב 3: אישור מול השרת שהתשלום הצליח
        const confirmResponse = await fetch('/.netlify/functions/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id,
            userEmail: currentUser.email
          })
        });

        if (confirmResponse.ok) {
          // עדכון המנוי במקומי
          await User.updateMyUserData({ subscription_tier: 'premium' });
          onSuccess();
        } else {
          onError('Payment verification failed');
        }
      }
    } catch (error) {
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Card Information
        </label>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay $10/month Securely</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-slate-500">
        <div className="flex items-center justify-center space-x-2">
          <Lock className="w-3 h-3" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
        <p className="mt-1">We never store your payment information</p>
      </div>
    </form>
  );
};

export const SecurePaymentForm = ({ onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};