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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-gradient-to-br from-purple-500 to-indigo-700 rounded-3xl p-8 text-white text-center shadow-2xl"
      >
        <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
          {t('itsAMatch')}
        </h2>
        <p className="text-lg opacity-90 mb-8">{t('youAndUserLiked', { name: matchedUser.full_name })}</p>

        <div className="relative flex justify-center items-center h-40 mb-8">
          <motion.img
            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.full_name}`}
            alt="You"
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            initial={{ x: '-50%', scale: 0 }}
            animate={{ x: '-25%', scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          />
          <motion.img
            src={matchedUser.avatar || `https://ui-avatars.com/api/?name=${matchedUser.full_name}`}
            alt={matchedUser.full_name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            initial={{ x: '50%', scale: 0 }}
            animate={{ x: '25%', scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute bg-white/20 p-3 rounded-full"
          >
            <Heart className="w-8 h-8 text-pink-300" fill="currentColor" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => onSendMessage(matchedUser.email, matchedUser.full_name)}
            className="w-full text-lg py-6 bg-white text-indigo-600 hover:bg-slate-100 flex items-center space-x-2"
          >
            <MessageSquare />
            <span>{t('sendMessage')}</span>
          </Button>
          <Button onClick={onClose} variant="link" className="w-full text-white/80 hover:text-white">
            {t('keepSwiping')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}