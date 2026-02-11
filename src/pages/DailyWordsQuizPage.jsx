import React, { useState, useEffect } from 'react';
import { HebrewWord, User } from '@/entities/all';
import { ArrowLeft, RefreshCw, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '../components/utils/i18n';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const categories = [
  { id: 'all', label: 'allWords', icon: '🌍' },
  { id: 'Basic', label: 'basicWords', icon: '👋' },
  { id: 'Numbers', label: 'numbers', icon: '🔢' },
  { id: 'Family', label: 'family', icon: '👨‍👩‍👧‍👦' },
  { id: 'Food', label: 'food', icon: '🍔' },
  { id: 'House', label: 'house', icon: '🏠' },
  { id: 'Jobs', label: 'professions', icon: '💼' },
  { id: 'Places', label: 'places', icon: '🏙️' },
  { id: 'Colors', label: 'colors', icon: '🎨' },
  { id: 'Animals', label: 'animals', icon: '🐘' },
];

// Reverted to the classic, simple card design from the user's image
const WordCard = ({ wordData, currentLanguage }) => {
    const { t } = useTranslation();

    const getTranslation = (word) => {
        switch (currentLanguage) {
            case 'he': return word.translation_he;
            case 'es': return word.translation_es;
            case 'fr': return word.translation_fr;
            default: return word.translation_en;
        }
    };
    
    const getExample = (word) => {
        switch (currentLanguage) {
            case 'he': return word.example_sentence_he;
            case 'es': return word.example_sentence_es;
            case 'fr': return word.example_sentence_fr;
            default: return word.example_sentence_en;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-4"
        >
            <div className="text-center">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">{wordData.word}</h3>
                <p className="text-lg text-slate-500">{wordData.pronunciation}</p>
                <p className="text-xl text-slate-800 font-medium mt-1">{getTranslation(wordData)}</p>
            </div>
            
            {(wordData.example_sentence_he || getExample(wordData)) && (
                <>
                    <div className="border-t my-4"></div>
                    <div className="text-center">
                        <p className="text-base text-slate-700">{wordData.example_sentence_he}</p>
                        {currentLanguage !== 'he' && <p className="text-base text-slate-500 mt-1">{getExample(wordData)}</p>}
                    </div>
                </>
            )}
        </motion.div>
    );
};


const CategorySelector = ({ selectedCategory, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('chooseWhatToLearn')}</h2>
      <p className="text-slate-600 mb-6">{t('pickCategoryAndLearn')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map(({ id, label, icon }) => (
          <motion.button
            key={id}
            onClick={() => onSelect(id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-6 rounded-2xl bg-white shadow-lg flex flex-col items-center justify-center space-y-3 transition-all duration-200 hover:shadow-xl"
          >
            <span className="text-4xl">{icon}</span>
            <span className="font-bold text-slate-800 text-lg">{t(label)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Helper function to get a seed that changes every Sunday
const getWeekSeed = () => {
    const now = new Date();
    // Get the current day of the week (0 for Sunday, 1 for Monday, etc.)
    const dayOfWeek = now.getDay();
    // Calculate the date for the start of the week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    return startOfWeek.toISOString().slice(0, 10); // 'YYYY-MM-DD' for the week's Sunday
};

export default function DailyWordsQuizPage({ onBack }) {
  const [mode, setMode] = useState('category');
  const [category, setCategory] = useState('all');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const loadWords = async (selectedCategory) => {
    setIsLoading(true);
    try {
      let fetchedWords;
      
      if (selectedCategory === 'all') {
        fetchedWords = await HebrewWord.list(undefined, 500);
      } else {
        fetchedWords = await HebrewWord.filter({ category: selectedCategory });
      }
      
      // CRITICAL FIX: Remove duplicate words based on the Hebrew word
      const uniqueWords = fetchedWords.filter((word, index, self) =>
        index === self.findIndex((t) => t.word === word.word)
      );

      const seed = getWeekSeed();
      const seedValue = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Shuffle unique words based on the weekly seed
      let shuffledWords = [...uniqueWords].sort((a, b) => {
        const idPartA = parseInt(a.id.slice(-5), 16) || 0; // Fallback to 0 if parsing fails
        const idPartB = parseInt(b.id.slice(-5), 16) || 0;
        const valA = (idPartA * seedValue) % 1000;
        const valB = (idPartB * seedValue) % 1000;
        return valA - valB;
      });

      // Take up to 15 words, or all available if less
      let finalWords = shuffledWords.slice(0, Math.min(15, shuffledWords.length));

      if (selectedCategory === 'Numbers') {
        const numberOrder = [
            "אחת", "שתיים", "שלוש", "ארבע", "חמש",
            "שש", "שבע", "שמונה", "תשע", "עשר",
            "אחת עשרה", "שתים עשרה", "שלוש עשרה", "ארבע עשרה", "חמש עשרה"
        ];
        // Use the unique list to find our numbers, then sort and slice.
        let numberWords = uniqueWords.filter(w => numberOrder.includes(w.word));
        numberWords.sort((a, b) => numberOrder.indexOf(a.word) - numberOrder.indexOf(b.word));
        finalWords = numberWords.slice(0, Math.min(15, numberWords.length));
      }
      
      // Show message if category has less than expected words
      if (finalWords.length < 15) {
        console.log(`Category has only ${finalWords.length} unique words available`);
      }

      setWords(finalWords);
      setCurrentWordIndex(0); // Reset index when new words are loaded
      setMode('learning');
    } catch (error) {
      console.error('Error loading words:', error);
      toast.error('Failed to load words');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    loadWords(selectedCategory);
  };

  const handleBackToCategory = () => {
    setMode('category');
    setWords([]);
    setCurrentWordIndex(0); // Reset index
  };

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }));
  };

  const handleNext = async () => {
    // Premium users see all 15 words, free users see 5.
    const isPremium = user?.subscription_tier === 'premium';
    const totalWordsForWeek = words.length; // This will be max 15
    const viewableLimit = isPremium ? totalWordsForWeek : 5; 
    
    if (currentWordIndex < viewableLimit - 1) {
      setCurrentWordIndex(prev => prev + 1);
      await updateWordProgress(currentWordIndex + 1);
    }
  };

  const updateWordProgress = async (wordCount) => {
    if (!user) return;
    
    try {
      const progress = await User.LearningProgress.filter({ user_email: user.email });
      const today = new Date().toISOString().split('T')[0];
      
      if (progress && progress.length > 0) {
        const currentProgress = progress[0];
        const lastUpdated = currentProgress.updated_date ? new Date(currentProgress.updated_date).toISOString().split('T')[0] : null;
        
        // Only update if it's a new word being learned
        if (wordCount > (currentProgress.current_session_words || 0)) {
          await User.LearningProgress.update(currentProgress.id, {
            total_words_learned: (currentProgress.total_words_learned || 0) + 1,
            current_session_words: wordCount,
            streak_count: lastUpdated === today ? currentProgress.streak_count : (currentProgress.streak_count || 0) + 1
          });
        }
      } else {
        await User.LearningProgress.create({
          user_email: user.email,
          total_words_learned: 1,
          current_session_words: 1,
          streak_count: 1
        });
      }
    } catch (error) {
      console.error('Error updating word progress:', error);
    }
  };

  const handlePrev = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const isPremium = user?.subscription_tier === 'premium';
  const totalWordsForWeek = words.length; 
  const viewableLimit = isPremium ? totalWordsForWeek : Math.min(5, totalWordsForWeek); 
  const isAtLimit = currentWordIndex >= viewableLimit - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">{t('loadingWords')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{t('dailyHebrewWords')}</h1>
          <div className="w-10"></div>
        </div>
        <p className="text-center text-slate-600 mt-2">{t('learnSomethingNew')}</p>
      </div>

      <div className="p-4">
        {mode === 'category' ? (
          <CategorySelector selectedCategory={category} onSelect={handleCategorySelect} />
        ) : (
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <button 
                onClick={handleBackToCategory}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                {t('finishAndChooseNew')}
              </button>
            </div>

            {words.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWordIndex} // Key changes to trigger animation on index change
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <WordCard wordData={words[currentWordIndex]} currentLanguage={currentLanguage} />
                </motion.div>
              </AnimatePresence>
            )}

            <div className="flex items-center justify-center space-x-4 mt-6">
              <Button onClick={handlePrev} disabled={currentWordIndex === 0} size="lg" variant="outline" className="rounded-full w-20 h-20">
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <div className="text-center font-semibold text-slate-600 w-24">
                {currentWordIndex + 1} / {viewableLimit}
              </div>
              <Button onClick={handleNext} disabled={isAtLimit || currentWordIndex === totalWordsForWeek - 1} size="lg" variant="outline" className="rounded-full w-20 h-20">
                <ChevronRight className="w-8 h-8" />
              </Button>
            </div>

            {!isPremium && isAtLimit && totalWordsForWeek > viewableLimit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl text-center"
              >
                <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t('learnedFreeWords')}</h3>
                <p 
                  className="mb-4"
                  dangerouslySetInnerHTML={{ __html: t('upgradeToUnlockWords') }} 
                />
                <Button onClick={handleUpgrade} size="lg" variant="secondary">
                  {t('upgradePremiumShort')}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}