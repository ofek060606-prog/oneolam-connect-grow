
import React, { useState, useEffect } from 'react';
import { User, Community, CommunityMember } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Crown } from 'lucide-react';
import { useTranslation } from '../components/utils/i18n';

export default function CreateCommunityPage({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Community',
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // If user is not premium, we show the premium-only message immediately.
      // The conditional rendering later handles this.
      if (user.subscription_tier !== 'premium') {
        // This toast might be redundant with the full screen message, but kept as per outline
        toast.error(t('premiumFeatureOnly'), {
          description: t('upgradeToCreateCommunities'),
          duration: 5000
        });
        // navigateTo is an event that should be handled by a parent component or router
        // Not directly calling window.location to keep it reactive
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }));
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error(t('mustBeLoggedIn'));
      onBack(); // Go back if user is not logged in or an error occurs fetching user
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Additional check in case the user somehow bypasses the UI restriction
    if (currentUser?.subscription_tier !== 'premium') {
      toast.error(t('premiumFeatureOnly'));
      return;
    }
    
    if (!formData.name || !formData.description) {
      toast.error(t('fillAllFields'));
      return;
    }
    
    setIsSaving(true);
    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        setIsUploading(true);
        const { file_url } = await UploadFile({ file: imageFile });
        imageUrl = file_url;
        setIsUploading(false);
      }

      // Use currentUser data, which was fetched once on mount
      const newCommunity = await Community.create({
        ...formData,
        image_url: imageUrl,
        creator_email: currentUser.email,
        creator_name: currentUser.full_name,
        is_approved: false
      });
      
      // The creator automatically becomes the first member
      await CommunityMember.create({
        community_id: newCommunity.id,
        member_email: currentUser.email,
        member_name: currentUser.full_name,
        member_avatar: currentUser.avatar
      });
      
      toast.success(t('communitySubmittedForApproval'), {
        description: t('adminWillReview')
      });
      onBack();
    } catch (error) {
      console.error("Failed to create community", error);
      toast.error(t('couldNotCreateCommunity'));
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not premium and we're done loading, display the premium feature message
  if (currentUser?.subscription_tier !== 'premium') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('premiumFeatureOnly')}</h2>
          <p className="text-slate-600 mb-6">{t('upgradeToCreateCommunities')}</p>
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'payment' } }))}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t('upgradeNow')}
          </Button>
        </div>
      </div>
    );
  }

  const categories = ["Torah Study", "Community", "Food & Culture", "Israel", "Language Learning", "Professional", "Social", "Family", "Other"];

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4">{t('createNewCommunity')}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full h-40 bg-slate-200 rounded-lg flex items-center justify-center">
             {previewUrl ? (
                <img src={previewUrl} alt={t('communityImagePreview')} className="w-full h-full object-cover rounded-lg" />
             ) : (
                <div className="text-center text-slate-500">
                    <p>{t('optionalCoverImage')}</p>
                </div>
             )}
            <label htmlFor="image-upload" className="absolute -bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full border-4 border-blue-50 cursor-pointer hover:bg-blue-600 transition-colors">
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            </label>
            <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <div className="pt-4">
          <label className="text-sm font-medium text-slate-700">{t('communityName')}</label>
          <Input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className="mt-1" 
            placeholder={t('communityNamePlaceholder')} 
            required 
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{t('description')}</label>
          <Textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="mt-1" 
            placeholder={t('descriptionPlaceholder')} 
            required 
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{t('category')}</label>
          <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder={t('selectCategoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{t(cat.replace(/\s/g, '')) || cat}</SelectItem>)} {/* Added basic translation for categories or fallback to original */}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isSaving} className="w-full py-3 text-base">
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : t('submitForApproval')}
        </Button>
      </form>
    </div>
  );
}
