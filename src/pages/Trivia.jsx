import React, { useState, useEffect } from 'react';
import { User, TriviaQuestion } from '@/entities/all';
import { Award, BrainCircuit, CheckCircle, AlertCircle, Loader2, ArrowLeft, History, Book, Users, Star, UtensilsCrossed, HelpCircle } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';
import { toast } from 'sonner';

const CategoryCard = ({ category, icon: Icon, onClick, isLocked = false }) => (
  <button
    onClick={onClick}
    disabled={isLocked}
    className={`relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
      isLocked ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <Icon className="w-12 h-12 mb-4 mx-auto" />
    <h3 className="text-lg font-bold text-center whitespace-pre-line">{category}</h3>
    {isLocked && (
      <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center">
        <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">Premium</div>
      </div>
    )}
  </button>
);

const TriviaQuestionCard = ({ question, onAnswer, hasAnswered, userAnswer, questionNum, totalQuestions }) => {
  if (!question || !question.options) {
    return <div className="text-center text-slate-500">Loading question...</div>;
  }

  const correctAnswer = question.correctAnswer;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Question {questionNum} / {totalQuestions}</h3>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(questionNum / totalQuestions) * 100}%` }}></div>
        </div>
      </div>
      <p className="text-xl md:text-2xl font-semibold text-slate-900 text-center mb-6 min-h-[6rem] flex items-center justify-center">
        {question.question}
      </p>
      {question.image_url && (
        <img src={question.image_url} alt="Trivia Question" className="w-full h-48 object-cover rounded-xl mb-6" />
      )}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, index) => {
          const isCorrect = option === correctAnswer;
          const isSelected = option === userAnswer;
          let buttonClass = 'bg-slate-100 text-slate-800 hover:bg-blue-50';

          if (hasAnswered) {
            if (isCorrect) {
              buttonClass = 'bg-green-100 text-green-800 border-2 border-green-300';
            } else if (isSelected) {
              buttonClass = 'bg-red-100 text-red-800 border-2 border-red-300';
            } else {
              buttonClass = 'bg-slate-100 text-slate-500 opacity-70';
            }
          }

          return (
            <button
              key={index}
              onClick={() => onAnswer(option, correctAnswer)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-300 ${buttonClass}`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {hasAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                {hasAnswered && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function TriviaPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(true);
  const { t, currentLanguage } = useTranslation();

  const categories = [
    { id: 'History', name: 'History', icon: History, isPremium: false },
    { id: 'Tanakh', name: 'Tanakh', icon: Book, isPremium: false },
    { id: 'Famous Figures', name: 'Famous\nFigures', icon: Users, isPremium: false },
    { id: 'Israeli Culture', name: 'Israeli\nCulture', icon: Star, isPremium: true },
    { id: 'Food', name: 'Food', icon: UtensilsCrossed, isPremium: true },
    { id: 'General', name: 'General', icon: HelpCircle, isPremium: false }
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setIsLoading(false);
    }
  };

  const fetchTriviaQuestions = async (category) => {
    setIsLoading(true);
    try {
      const allQuestions = await TriviaQuestion.list(undefined, 1000);
      if (allQuestions.length === 0) {
        toast.error("No trivia questions available");
        setIsLoading(false);
        return;
      }

      const isPremium = currentUser?.subscription_tier === 'premium';
      let availableQuestions = allQuestions.filter(q => isPremium || !q.is_premium);

      if (category && category !== 'All') {
        availableQuestions = availableQuestions.filter(q => q.category === category);
      }
      
      if (availableQuestions.length === 0) {
        toast.info(`No questions found for the '${category}' category.`);
        setIsLoading(false);
        return;
      }

      const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
      const questionsForGame = shuffled.slice(0, Math.min(10, shuffled.length));

      const transformedQuestions = questionsForGame.map(q => ({
        ...q,
        question: q[`question_${currentLanguage}`] || q.question_en,
        options: q[`options_${currentLanguage}`] || q.options_en,
        correctAnswer: q[`correct_answer_${currentLanguage}`] || q.correct_answer_en
      }));

      setQuestions(transformedQuestions);
      setShowCategories(false);
    } catch (error) {
      console.error("Failed to fetch trivia questions:", error);
      toast.error("Could not load trivia questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId, isPremium) => {
    if (isPremium && currentUser?.subscription_tier !== 'premium') {
      toast.error("This category requires Premium subscription!");
      return;
    }
    setSelectedCategory(categoryId);
    fetchTriviaQuestions(categoryId);
  };

  const handleAnswer = (selectedOption, correctAnswer) => {
    if (hasAnswered) return;

    setHasAnswered(true);
    setUserAnswer(selectedOption);

    if (selectedOption === correctAnswer) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setHasAnswered(false);
        setUserAnswer('');
      } else {
        setGameComplete(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setHasAnswered(false);
    setUserAnswer('');
    setGameComplete(false);
    setShowCategories(true);
    setSelectedCategory(null);
    setQuestions([]);
  };

  const handleBackToFeed = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'learn' } }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg p-4 flex items-center justify-between">
        <button onClick={handleBackToFeed} className="p-2 hover:bg-blue-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <div className="text-center">
          <BrainCircuit className="w-8 h-8 text-blue-600 mx-auto mb-1" />
          <h1 className="text-xl font-bold text-slate-900">Jewish Trivia</h1>
          <p className="text-sm text-slate-600">Test your knowledge!</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="p-4">
        {showCategories ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose a Category</h2>
              <p className="text-slate-600">Select a topic to start your trivia challenge!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category.name}
                  icon={category.icon}
                  onClick={() => handleCategorySelect(category.id, category.isPremium)}
                  isLocked={category.isPremium && currentUser?.subscription_tier !== 'premium'}
                />
              ))}
            </div>
          </div>
        ) : gameComplete ? (
          <div className="text-center space-y-6">
            <Award className="w-20 h-20 text-yellow-500 mx-auto" />
            <h2 className="text-3xl font-bold text-slate-900">Quiz Complete!</h2>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-blue-600 mb-2">Your Score</h3>
              <p className="text-4xl font-bold text-slate-900">{score} / {questions.length}</p>
              <p className="text-slate-600 mt-2">
                {score === questions.length ? "Perfect! 🎉" : 
                 score >= questions.length * 0.8 ? "Great job! 👏" : 
                 score >= questions.length * 0.6 ? "Good effort! 👍" : "Keep learning! 📚"}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-600"
              >
                Play Again
              </button>
              <button
                onClick={handleBackToFeed}
                className="w-full bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-medium hover:bg-slate-300"
              >
                Back to Learning
              </button>
            </div>
          </div>
        ) : (
          questions.length > 0 && (
            <TriviaQuestionCard
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              hasAnswered={hasAnswered}
              userAnswer={userAnswer}
              questionNum={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          )
        )}
      </div>
    </div>
  );
}