import React, { useState } from 'react';
import { User } from '@/entities/all';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from '../utils/i18n';

export const AskQuestionForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsLoading(true);
    try {
      const user = await User.me();
      const questionData = {
        title,
        content,
        category,
        author_name: user.full_name,
        upvotes: 0,
        answers_count: 0,
        creation_time: new Date().toISOString(),
      };
      await onSubmit(questionData);
    } catch (error) {
      console.error("Failed to submit question", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{t('askQuestion')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder={t('questionTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder={t('questionContentPlaceholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">{t('general')}</SelectItem>
            <SelectItem value="career">{t('career')}</SelectItem>
            <SelectItem value="technology">{t('technology')}</SelectItem>
            <SelectItem value="lifestyle">{t('lifestyle')}</SelectItem>
            <SelectItem value="business">{t('business')}</SelectItem>
            <SelectItem value="creative">{t('creative')}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('submitting') : t('submitQuestion')}
          </Button>
        </div>
      </form>
    </div>
  );
};