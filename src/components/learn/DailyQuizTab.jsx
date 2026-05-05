import React, { useState, useEffect } from 'react';
import { HebrewWord, LearningProgress, User } from '@/entities/all';
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { toast } from 'sonner';

export const DailyQuizTab = () => {
  const [quizWords, setQuizWords] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    checkIfCanStartQuiz();
  }, []);

  const checkIfCanStartQuiz = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const progress = await LearningProgress.filter({ user_email: user.email });
      
      if (!progress || progress.length === 0 || progress[0].total_words_learned < 5) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking quiz availability:', error);
      setIsLoading(false);
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const allWords = await HebrewWord.list('-created_date', 50);
      
      if (allWords.length < 5) {
        toast.error(t('notEnoughWordsForQuiz'));
        setIsLoading(false);
        return;
      }
      
      const recentWords = allWords.slice(0, 15);
      const shuffled = recentWords.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5);
      
      const quizData = selected.map(word => {
        const correctAnswer = word[`translation_${currentLanguage}`] || word.translation_en;
        
        const otherWords = allWords.filter(w => w.id !== word.id);
        const wrongAnswers = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w[`translation_${currentLanguage}`] || w.translation_en);
        
        const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
          word: word.word,
          correctAnswer,
          options: allAnswers,
          pronunciation: word.pronunciation
        };
      });
      
      setQuizWords(quizData);
      setQuizStarted(true);
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error(t('errorLoadingQuiz'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === quizWords[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestion + 1 < quizWords.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
      await updateLearningProgress();
    }
  };

  const updateLearningProgress = async () => {
    try {
      const user = await User.me();
      const progress = await LearningProgress.filter({ user_email: user.email });
      
      const today = new Date().toISOString().split('T')[0];
      
      if (progress && progress.length > 0) {
        const currentProgress = progress[0];
        const lastUpdated = currentProgress.updated_date ? new Date(currentProgress.updated_date).toISOString().split('T')[0] : null;
        
        // Only update streak if it's a new day
        const newStreak = lastUpdated === today ? currentProgress.streak_count : (currentProgress.streak_count || 0) + 1;
        
        await LearningProgress.update(currentProgress.id, {
          streak_count: newStreak,
          last_quiz_score: score,
          last_quiz_date: today
        });
      } else {
        await LearningProgress.create({
          user_email: user.email,
          total_words_learned: 0,
          streak_count: 1,
          last_quiz_score: score,
          last_quiz_date: today
        });
      }
      
      toast.success(`Quiz completed! Score: ${score}/${quizWords.length}`);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
    setQuizStarted(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">{t('loading')}</p>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">{t('quizOnLearnedWords')}</h3>
            <p className="text-emerald-600 text-xs">{t('testYourKnowledge5Questions')}</p>
          </div>
        </div>
        <Button onClick={startQuiz} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 text-sm rounded-xl shadow font-bold shrink-0">
          🚀 {t('startQuiz')}
        </Button>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / quizWords.length) * 100);
    return (
      <div className="text-center py-4">
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6 rounded-2xl mb-4 border-2 border-yellow-200 shadow-lg">
          <div className="mb-3">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto drop-shadow-lg" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">🎉 {t('quizComplete')} 🎉</h3>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-3 inline-block shadow-md">
            <p className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
              {score}/{quizWords.length}
            </p>
            <p className="text-sm text-slate-600 font-semibold">{percentage}% correct</p>
          </div>
          {percentage >= 80 ? (
            <p className="text-lg font-bold text-green-600 mb-2">{t('excellentMasteredWords')}</p>
          ) : percentage >= 60 ? (
            <p className="text-lg font-bold text-blue-600 mb-2">{t('nicePracticeWords')}</p>
          ) : (
            <p className="text-lg font-bold text-orange-600 mb-2">{t('keepLearningImproving')}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={handleRestart} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-3 text-sm rounded-xl shadow-lg font-bold">
            🔄 {t('playAgain')}
          </Button>
          <Button onClick={() => { handleRestart(); setTimeout(startQuiz, 100); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-3 text-sm rounded-xl shadow-lg font-bold">
            <RefreshCw className="w-4 h-4 mr-1" />
            ✨ {t('tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (quizWords.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('notLearnedWordsYet')}</h3>
        <p className="text-slate-500">{t('learnWordsToUnlockQuiz')}</p>
      </div>
    );
  }

  const currentQ = quizWords[currentQuestion];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-emerald-700">
          📝 {t('question')} {currentQuestion + 1} {t('of')} {quizWords.length}
        </span>
        <span className="text-xs font-bold text-teal-600">
          ⭐ {t('yourScore')}: {score}
        </span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4 shadow-inner">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 shadow-md"
          style={{ width: `${((currentQuestion + 1) / quizWords.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white p-6 rounded-2xl text-center shadow-lg border-2 border-blue-400">
        <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-1 rounded-lg mb-2">
          <p className="text-xs font-semibold">💭 {t('whatDoesThisMean')}?</p>
        </div>
        <h2 className="text-3xl font-black mb-2 drop-shadow-lg">{currentQ.word}</h2>
        <p className="text-sm opacity-90 italic">"{currentQ.pronunciation}"</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {currentQ.options.map((option, index) => {
          const isCorrect = option === currentQ.correctAnswer;
          const isSelected = option === selectedAnswer;
          
          let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all transform font-bold text-sm ";
          
          if (showResult) {
            if (isCorrect) {
              buttonClass += "bg-gradient-to-r from-green-400 to-emerald-500 border-green-600 text-white shadow-lg scale-105";
            } else if (isSelected && !isCorrect) {
              buttonClass += "bg-gradient-to-r from-red-400 to-pink-500 border-red-600 text-white shadow-lg";
            } else {
              buttonClass += "bg-slate-100 border-slate-200 text-slate-400";
            }
          } else {
            buttonClass += "bg-white hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 text-slate-800 border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md hover:scale-102";
          }
          
          return (
            <button
              key={index}
              onClick={() => !showResult && handleAnswer(option)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg font-black mr-2 opacity-70">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </div>
                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <Button onClick={handleNext} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 text-base rounded-xl shadow-lg font-black transform hover:scale-105 transition-all">
          {currentQuestion + 1 < quizWords.length ? (
            <>
              {t('next')} ➡️
            </>
          ) : (
            <>🎯 {t('finishQuiz')}</>
          )}
        </Button>
      )}
    </div>
  );
};