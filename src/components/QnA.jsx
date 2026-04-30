import React, { useState, useEffect } from 'react';
import { Question, User } from '@/entities/all';
import { Plus, Search, TrendingUp, Clock, Award, MessageCircle, ArrowUp, Trash2 } from 'lucide-react';

import { AskQuestionForm } from './qna/AskQuestionForm';
import { useTranslation } from './utils/i18n';
import { toast } from 'sonner';

export const QnA = () => {
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useTranslation();

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const categories = [
    { id: 'all', label: t('allTopics') },
    { id: 'general', label: t('general') },
    { id: 'career', label: t('career') },
    { id: 'technology', label: t('technology') },
    { id: 'lifestyle', label: t('lifestyle') },
    { id: 'business', label: t('business') },
    { id: 'creative', label: t('creative') }
  ];

  const sortOptions = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'top', label: 'Top Rated', icon: Award }
  ];

  useEffect(() => {
    loadQuestions();
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) { /* Not logged in or error fetching user, no action needed */ }
    };
    fetchUser();
  }, [selectedCategory, sortBy]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      let questionsData;
      const sortField = sortBy === 'recent' ? '-created_date' : 
                       sortBy === 'trending' ? '-answers_count' : '-upvotes';
      
      if (selectedCategory === 'all') {
        questionsData = await Question.list(sortField, 20);
      } else {
        questionsData = await Question.filter({ category: selectedCategory }, sortField, 20);
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuestionClick = (questionId) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'question-detail', questionId } }));
  }

  const handleAskSubmit = async (questionData) => {
    await Question.create(questionData);
    setShowAskForm(false);
    loadQuestions(); // Refresh questions
  };

  const handleDeleteQuestion = async (e, questionId) => {
    e.stopPropagation(); // Prevents navigating to question detail
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      await Question.delete(questionId);
      toast.success("Question deleted.");
      loadQuestions(); // Refresh question list
    } catch (err) {
      console.error("Failed to delete question:", err);
      toast.error("Could not delete question.");
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (question.content && question.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const QuestionCard = ({ question }) => (
    <div 
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleQuestionClick(question.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
            {question.title}
          </h3>
          <p className="text-slate-600 mb-3 line-clamp-3">{question.content}</p>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${{
              general: 'bg-slate-100 text-slate-700',
              career: 'bg-blue-100 text-blue-700',
              technology: 'bg-purple-100 text-purple-700',
              lifestyle: 'bg-green-100 text-green-700',
              business: 'bg-orange-100 text-orange-700',
              creative: 'bg-pink-100 text-pink-700'
            }[question.category] || 'bg-slate-100 text-slate-700'}`}>
              {question.category}
            </span>
            <span className="text-slate-500">by {question.author_name}</span>
            <span className="text-slate-500">{formatTime(question.created_date)}</span>
          </div>
        </div>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={(e) => handleDeleteQuestion(e, question.id)}
            className="p-2 text-slate-400 hover:text-red-500 rounded-full shrink-0 ml-2"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm font-medium">{question.upvotes}</span>
          </button>
          <div className="flex items-center space-x-1 text-slate-500">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{question.answers_count} {t('answers')}</span>
          </div>
        </div>
        <span className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
          {t('answer')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{t('qnaTitle')}</h1>
            <button
              onClick={() => setShowAskForm(!showAskForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('ask')}</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchQuestions')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-hide">
            {categories.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex space-x-2">
            {sortOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSortBy(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  sortBy === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="px-4 pt-6 space-y-4">
        {showAskForm && <AskQuestionForm onSubmit={handleAskSubmit} onCancel={() => setShowAskForm(false)} />}
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-3/4 h-6 bg-slate-200 rounded mb-3"></div>
                <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
                <div className="w-2/3 h-4 bg-slate-200 rounded mb-4"></div>
                <div className="flex space-x-4">
                  <div className="w-16 h-6 bg-slate-200 rounded"></div>
                  <div className="w-20 h-6 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {searchQuery ? 'No questions found' : t('noQuestions')}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery ? 'Try searching for something else' : t('beFirst')}
                </p>
                <button
                  onClick={() => setShowAskForm(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  {t('askQuestion')}
                </button>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};