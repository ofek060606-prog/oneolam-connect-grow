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
      <div className="text-center py-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl mb-6 border border-blue-100">
          <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('quizOnLearnedWords')}</h3>
          <p className="text-slate-600 mb-4">{t('testYourKnowledge5Questions')}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={startQuiz} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-xl">
            {t('startQuiz')}
          </Button>
          <Button onClick={startQuiz} variant="outline" className="px-6 py-6 text-lg rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / quizWords.length) * 100);
    return (
      <div className="text-center py-8">
        <Trophy className={`w-20 h-20 mx-auto mb-4 ${percentage >= 80 ? 'text-yellow-500' : 'text-blue-500'}`} />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('quizComplete')}</h3>
        <p className="text-4xl font-bold text-blue-500 mb-2">{score}/{quizWords.length}</p>
        <p className="text-lg text-slate-600 mb-6">{percentage}% {t('correct')}</p>
        {percentage >= 80 ? (
          <p className="text-green-600 font-medium mb-6">{t('excellentMasteredWords')}</p>
        ) : percentage >= 60 ? (
          <p className="text-blue-600 font-medium mb-6">{t('nicePracticeWords')}</p>
        ) : (
          <p className="text-orange-600 font-medium mb-6">{t('keepLearningImproving')}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleRestart} className="bg-blue-500 hover:bg-blue-600">
            {t('playAgain')}
          </Button>
          <Button onClick={() => { handleRestart(); setTimeout(startQuiz, 100); }} variant="outline">
            <RefreshCw className="w-5 h-5 mr-2" />
            {t('tryAgain')}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">
          {t('question')} {currentQuestion + 1} {t('of')} {quizWords.length}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {t('yourScore')}: {score}/{currentQuestion}
        </span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / quizWords.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white p-8 rounded-2xl text-center">
        <p className="text-sm opacity-90 mb-2">{t('whatDoesThisMean')}?</p>
        <h2 className="text-4xl font-bold mb-2">{currentQ.word}</h2>
        <p className="text-sm opacity-90">({currentQ.pronunciation})</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, index) => {
          const isCorrect = option === currentQ.correctAnswer;
          const isSelected = option === selectedAnswer;
          
          let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all ";
          
          if (showResult) {
            if (isCorrect) {
              buttonClass += "bg-green-50 border-green-500 text-green-700";
            } else if (isSelected && !isCorrect) {
              buttonClass += "bg-red-50 border-red-500 text-red-700";
            } else {
              buttonClass += "bg-slate-50 border-slate-200 text-slate-400";
            }
          } else {
            buttonClass += isSelected 
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50";
          }
          
          return (
            <button
              key={index}
              onClick={() => !showResult && handleAnswer(option)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option}</span>
                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <Button onClick={handleNext} className="w-full bg-blue-500 hover:bg-blue-600 py-6 text-lg">
          {currentQuestion + 1 < quizWords.length ? (
            <>
              {t('next')} <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            t('finishQuiz')
          )}
        </Button>
      )}
    </div>
  );
};