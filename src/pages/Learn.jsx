import React from 'react';
import { BookOpen, Lightbulb, Trophy, Sparkles } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { DailyQuizTab } from '../components/learn/DailyQuizTab';

export default function LearnPage() {
  const { t } = useTranslation();

  const handleNavigateToTrivia = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'trivia' } }));
  };

  const handleNavigateToDailyWords = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'daily-words-quiz' } }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6">
        <div className="flex items-center space-x-3 mb-2">
          <BookOpen className="w-8 h-8" />
          <h1 className="text-3xl font-bold">{t('learn')}</h1>
        </div>
        <p className="text-blue-100">{t('learnSomethingNew')}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Daily Hebrew Words */}
        <div 
          onClick={handleNavigateToDailyWords}
          className="bg-gradient-to-r from-indigo-400 to-purple-500 p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('dailyHebrewWords')}</h2>
                <p className="text-indigo-100">{t('learnNewWords')}</p>
              </div>
            </div>
            <Sparkles className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        {/* Jewish Trivia */}
        <div 
          onClick={handleNavigateToTrivia}
          className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('jewishTrivia')}</h2>
                <p className="text-purple-100">{t('testKnowledge')}</p>
              </div>
            </div>
            <Trophy className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        {/* Daily Quiz Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl shadow-xl p-6 border-2 border-emerald-200">
          <DailyQuizTab />
        </div>
      </div>
    </div>
  );
}