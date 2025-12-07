import React, { useState } from 'react';
import { User } from '@/entities/all';
import { Crown, ArrowLeft, BrainCircuit, Users, BookOpen, Gamepad2, Zap, Star } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { RealStripePayment } from '../components/payments/RealStripePayment';
import { StripeSetupInstructions as PaymentInstructions } from '../components/payments/STRIPE_SETUP_INSTRUCTIONS';

export default function PaymentPage({ onBack }) {
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useTranslation();

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handlePaymentSuccess = () => {
    onBack();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button
          onClick={onBack}
          className="p-2 hover:bg-blue-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4">{t('upgradePremium')}</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* הוראות התקנה */}
        <PaymentInstructions />

        {/* Premium Features */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('premiumFeatures')}</h2>
            <p className="text-slate-600">{t('deepenConnection')}</p>
          </div>

          <div className="grid gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-slate-800">{t('unlimitedAiMatchmaking')}</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <Zap className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-slate-800">{t('dailySuperSwipes')}</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-orange-600" />
              <span className="font-medium text-slate-800">{t('enhancedLearningTools')}</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
              <span className="font-medium text-slate-800">{t('advancedCommunityFeatures')}</span>
            </div>


            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
              <Gamepad2 className="w-6 h-6 text-red-600" />
              <span className="font-medium text-slate-800">{t('unlimitedTriviaGames')}</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <Star className="w-6 h-6 text-indigo-600" />
              <span className="font-medium text-slate-800">{t('priorityVisibility')}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-slate-900 mb-2">$10<span className="text-lg text-slate-500">/month</span></div>
            <p className="text-slate-600">Cancel anytime</p>
          </div>

          {/* רכיב התשלום האמיתי */}
          <RealStripePayment
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    </div>
  );
}