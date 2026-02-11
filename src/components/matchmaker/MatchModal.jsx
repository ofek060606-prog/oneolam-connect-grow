import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

export function MatchModal({ currentUser, matchedUser, onClose, onSendMessage }) {
  const { t } = useTranslation();
  if (!matchedUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Confetti/Sparkle Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: Math.random() * window.innerHeight,
              x: Math.random() * window.innerWidth,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [null, Math.random() * -200 - 100],
              scale: [0, Math.random() * 1.5 + 0.5, 0],
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: Math.random() * 2 + 2,
              delay: Math.random() * 0.5,
              repeat: Infinity,
              repeatDelay: Math.random() * 3
            }}
            className={`absolute w-3 h-3 ${
              i % 3 === 0 ? 'bg-pink-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-yellow-300'
            } rounded-full`}
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%'
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.5, y: 100, rotateZ: -5 }}
        animate={{ scale: 1, y: 0, rotateZ: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0"
        />

        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <h2 className="text-6xl font-black mb-2 drop-shadow-lg" style={{ fontFamily: "'Pacifico', cursive" }}>
              💕 {t('itsAMatch')} 💕
            </h2>
          </motion.div>
          <p className="text-xl opacity-95 mb-8 font-semibold">
            {t('youAndUserLiked').replace('{name}', matchedUser.full_name)}
          </p>

          <div className="relative flex justify-center items-center h-44 mb-8">
            <motion.img
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.full_name}`}
              alt="You"
              className="w-36 h-36 rounded-full border-4 border-white shadow-2xl object-cover ring-4 ring-pink-300"
              initial={{ x: '-60%', scale: 0, rotate: -20 }}
              animate={{ x: '-25%', scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            />
            <motion.img
              src={matchedUser.avatar || `https://ui-avatars.com/api/?name=${matchedUser.full_name}`}
              alt={matchedUser.full_name}
              className="w-36 h-36 rounded-full border-4 border-white shadow-2xl object-cover ring-4 ring-purple-300"
              initial={{ x: '60%', scale: 0, rotate: 20 }}
              animate={{ x: '25%', scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.3, 1],
                rotate: 0
              }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
              className="absolute bg-white p-4 rounded-full shadow-2xl"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
              </motion.div>
            </motion.div>
          </div>

          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => onSendMessage(matchedUser.email, matchedUser.full_name)}
                className="w-full text-xl py-7 bg-white text-purple-600 hover:bg-pink-50 font-black rounded-2xl shadow-xl flex items-center justify-center space-x-3"
              >
                <MessageSquare className="w-6 h-6" />
                <span>{t('sendMessage')}</span>
              </Button>
            </motion.div>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              className="w-full text-white/90 hover:text-white hover:bg-white/10 font-semibold text-lg py-6 rounded-xl"
            >
              {t('keepSwiping')}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}