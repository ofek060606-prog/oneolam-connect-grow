import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, languages } from './utils/i18n';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useTranslation();
  
  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <Globe className="w-6 h-6 text-blue-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};