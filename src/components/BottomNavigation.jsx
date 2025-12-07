import React from 'react';
import { Home, Search, User, HelpCircle, Gamepad2 } from 'lucide-react';
import { useTranslation } from './utils/i18n';

export const BottomNavigation = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const navItems = [
    { id: 'feed', icon: Home, label: t('feed') },
    { id: 'explore', icon: Search, label: t('explore') },
    { id: 'qna', icon: HelpCircle, label: t('qna') },
    { id: 'profile', icon: User, label: t('profile') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-blue-100 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 w-16 ${
              activeTab === id
                ? 'text-blue-600 bg-blue-50 shadow-sm transform scale-105'
                : 'text-slate-500 hover:text-blue-500 hover:bg-blue-25'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
      
      {/* Floating Learn Button */}
      <button
        onClick={() => onTabChange('learn')}
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        <Gamepad2 className="w-6 h-6" color="white" />
      </button>
    </div>
  );
};