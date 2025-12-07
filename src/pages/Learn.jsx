
import React, { useState, useEffect } from 'react';
import { User, LearningProgress } from '@/entities/all';
import { BookOpen, Lightbulb, Trophy, Sparkles, TrendingUp, Flame, Star } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { DailyQuizTab } from '../components/learn/DailyQuizTab';

export default function LearnPage() {
  const { t } = useTranslation();
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);

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

        {/* Your Progress Section with Daily Quiz Tab */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">{t('your_progress')}</h3>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-slate-200">
            <button
              onClick={() => setShowDailyQuiz(false)}
              className={`px-4 py-2 font-medium transition-colors ${
                !showDailyQuiz
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 {t('statistics')}
            </button>
            <button
              onClick={() => setShowDailyQuiz(true)}
              className={`px-4 py-2 font-medium transition-colors ${
                showDailyQuiz
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ✏️ {t('dailyQuiz')}
            </button>
          </div>

          {!showDailyQuiz ? (
            // Original Progress Stats
            <ProgressStats />
          ) : (
            // Daily Quiz
            <DailyQuizTab />
          )}
        </div>
      </div>
    </div>
  );
}

// Component for the original progress stats
function ProgressStats() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userProgress = await LearningProgress.filter({ user_email: user.email });
      
      if (userProgress && userProgress.length > 0) {
        setProgress(userProgress[0]);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500">{t('loading')}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
        <div className="flex items-center space-x-2 mb-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <h4 className="font-semibold text-slate-700">{t('day_streak')}</h4>
        </div>
        <p className="text-3xl font-bold text-orange-600">
          {progress?.streak_count || 0}
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="w-6 h-6 text-green-500" />
          <h4 className="font-semibold text-slate-700">{t('words_learned')}</h4>
        </div>
        <p className="text-3xl font-bold text-green-600">
          {progress?.total_words_learned || 0}
        </p>
      </div>
    </div>
  );
}
