import React from 'react';
import { Code, Copy } from 'lucide-react';

export const StripeSetupInstructions = () => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Code className="w-5 h-5 mr-2" />
        קוד להעתקה - תשלומים אמיתיים
      </h2>

      {/* צעד 1 */}
      <div className="mb-6">
        <h3 className="font-bold text-green-700 mb-2">צעד 1: הירשם ל-Stripe</h3>
        <p className="text-sm mb-2">לך ל: <code className="bg-slate-200 px-2 py-1 rounded">stripe.com</code></p>
        <p className="text-sm">קבל: Publishable Key ו-Secret Key</p>
      </div>

      {/* צעד 2 */}
      <div className="mb-6">
        <h3 className="font-bold text-green-700 mb-2">צעד 2: הפעל Backend Functions</h3>
        <p className="text-sm">Dashboard → Settings → Backend Functions → Enable</p>
      </div>

      {/* צעד 3 */}
      <div className="mb-6">
        <h3 className="font-bold text-green-700 mb-2">צעד 3: Environment Variables</h3>
        <p className="text-sm mb-2">הוסף ב-Dashboard → Settings → Environment Variables:</p>
        <div className="bg-slate-800 text-green-400 p-3 rounded text-xs font-mono">
          STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here<br/>
          STRIPE_SECRET_KEY=sk_test_your_secret_key_here
        </div>
      </div>

      {/* צעד 4 */}
      <div className="mb-6">
        <h3 className="font-bold text-green-700 mb-2">צעד 4: יצור קובץ payment-intent.js</h3>
        <button 
          onClick={() => copyToClipboard(paymentIntentCode)}
          className="bg-blue-500 text-white px-3 py-1 rounded mb-2 text-xs flex items-center"
        >
          <Copy className="w-3 h-3 mr-1" /> העתק קוד
        </button>
        <pre className="bg-slate-800 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-60">
          {paymentIntentCode}
        </pre>
      </div>

      {/* צעד 5 */}
      <div className="mb-6">
        <h3 className="font-bold text-green-700 mb-2">צעד 5: יצור קובץ confirm-payment.js</h3>
        <button 
          onClick={() => copyToClipboard(confirmPaymentCode)}
          className="bg-blue-500 text-white px-3 py-1 rounded mb-2 text-xs flex items-center"
        >
          <Copy className="w-3 h-3 mr-1" /> העתק קוד
        </button>
        <pre className="bg-slate-800 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-60">
          {confirmPaymentCode}
        </pre>
      </div>

      {/* צעד 6 */}
      <div>
        <h3 className="font-bold text-green-700 mb-2">צעד 6: עדכן את הקומפוננט</h3>
        <p className="text-sm text-slate-600">הקומפוננט כבר מוכן ויעבוד אוטומטית אחרי שתעשה את הצעדים למעלה!</p>
      </div>
    </div>
  );
};

// הקוד להעתקה
const paymentIntentCode = `const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // הגדרת CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { amount, currency = 'usd', userEmail } = JSON.parse(event.body);
    
    // אבטחה בסיסית
    if (!amount || amount < 1 || amount > 1000) {
      throw new Error('Invalid amount');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe משתמש בסנטים
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userEmail,
        service: 'OneOlam Premium'
      }
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
  } catch (error) {
    console.error('Payment Intent Error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`;

const confirmPaymentCode = `const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { paymentIntentId, userEmail } = JSON.parse(event.body);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // כאן תוכל להוסיף לוגיקה לעדכון הדאטה בייס
      // לדוגמא: עדכון סטטוס המשתמש ל-premium
      
      console.log(\`Payment succeeded for user: \${userEmail}\`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100
        })
      };
    } else {
      throw new Error('Payment not completed');
    }
    
  } catch (error) {
    console.error('Confirm Payment Error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};`;