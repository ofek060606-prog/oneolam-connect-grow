import React from 'react';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

export const PaymentInstructions = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 mb-6">
      <div className="flex items-start space-x-3">
        <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-900 mb-3">להפעלת תשלומים אמיתיים:</h3>
          
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>הירשם ל-Stripe או PayPal</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>הפעל Backend Functions ב-Dashboard → Settings</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>הגדר Environment Variables עם המפתחות</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>יצור פונקציות payment-intent.js ו-confirm-payment.js</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <strong>חשוב:</strong> הקומפוננט הנוכחי הוא הדמיה בלבד. 
                לתשלומים אמיתיים, צריך להשלים את הצעדים למעלה.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};