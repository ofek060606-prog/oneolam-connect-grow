
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { format, parseISO } from 'date-fns';
import { moderateUserProfile } from '../utils/contentModeration';

export const EditProfileForm = ({ onBack, onSave, isOnboarding = false }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    interests: [],
    avatar: '',
    preferred_language: 'en',
    date_of_birth: '',
    account_privacy: 'public', // Added
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { t, changeLanguage } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          bio: userData.bio || '',
          location: userData.location || '',
          interests: userData.interests || [],
          avatar: userData.avatar || '',
          preferred_language: userData.preferred_language || 'en',
          date_of_birth: userData.date_of_birth ? format(parseISO(userData.date_of_birth), 'yyyy-MM-dd') : '',
          account_privacy: userData.account_privacy || 'public', // Added
        });
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If language changed, update the UI language immediately
    if (name === 'preferred_language') {
      changeLanguage(value);
    }
  };

  const handleInterestChange = (e) => {
    // Basic comma-separated string to array
    const interestsArray = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, interests: interestsArray }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar: file_url }));
      toast.success("Profile picture uploaded!");
    } catch (error) {
      console.error("Failed to upload avatar", error);
      toast.error("Could not upload profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isOnboarding && !formData.date_of_birth) {
      toast.error("Please enter your date of birth to continue.");
      return;
    }
    
    if (isOnboarding && !agreedToTerms) {
      toast.error("You must agree to the terms and conditions to continue.");
      return;
    }

    // בדיקת תוכן הפרופיל
    const moderationResult = await moderateUserProfile(formData);
    if (!moderationResult.safe) {
      const issues = moderationResult.issues.map(issue => 
        `${issue.field}: ${issue.reason}`
      ).join(', ');
      toast.error(`Profile contains inappropriate content: ${issues}`);
      return;
    }

    let age = null;
    if (formData.date_of_birth) {
        try {
            const birthDate = new Date(formData.date_of_birth);
            const currentDate = new Date();
            age = currentDate.getFullYear() - birthDate.getFullYear();
            const monthDiff = currentDate.getMonth() - birthDate.getMonth();
            
            // Adjust age if birthday hasn't occurred this year
            if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
                age = age - 1;
            }
            
            if (age < 13) {
                toast.error("You must be at least 13 years old to use this app.");
                return;
            }
        } catch (err) {
            toast.error("Invalid date format. Please select a valid date.");
            return;
        }
    }

    setIsSaving(true);
    try {
      const dataToUpdate = { ...formData, age };

      await User.updateMyUserData(dataToUpdate);
      toast.success("Profile saved successfully!");
      onSave(dataToUpdate);
    } catch (error) {
      console.error("Failed to save profile", error);
      toast.error("Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }
  
  return (
    <div className="min-h-screen bg-blue-50">
       <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center">
          {!isOnboarding && onBack && (
            <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-blue-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900 ml-4">
            {isOnboarding ? 'Welcome! Set up your profile' : 'Edit Profile'}
          </h1>
        </div>
        
        {/* Save Button in Header */}
        {!isOnboarding && (
          <Button 
            onClick={handleSubmit}
            disabled={isSaving || isUploadingAvatar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('save')}
          </Button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img 
              src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.full_name || 'A'}&background=random&size=96`}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            />
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-2 rounded-full border-2 border-blue-50 cursor-pointer hover:bg-blue-600 transition-colors">
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar}
            />
          </div>
          <p className="text-sm text-slate-500 text-center">Click the camera icon to upload a profile picture</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Full Name</label>
          <Input name="full_name" value={formData.full_name} onChange={handleChange} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Date of Birth</label>
          <Input 
            type="date" 
            name="date_of_birth" 
            value={formData.date_of_birth} 
            onChange={handleChange} 
            className="mt-1"
            required={isOnboarding}
            max={format(new Date(), 'yyyy-MM-dd')} // Prevents selecting future dates
          />
          <p className="text-xs text-slate-500 mt-1">
            Required for age verification. You must be 18+ for some features like AI Matchmaker.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Bio</label>
          <Textarea name="bio" value={formData.bio} onChange={handleChange} className="mt-1" placeholder="Tell the community a little about yourself..." />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Location</label>
          <Input name="location" value={formData.location} onChange={handleChange} className="mt-1" placeholder="e.g., New York, USA" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Interests</label>
          <Input value={formData.interests ? formData.interests.join(', ') : ''} onChange={handleInterestChange} className="mt-1" placeholder="e.g., Torah, Tech, Travel" />
          <p className="text-xs text-slate-500 mt-1">Separate interests with a comma.</p>
        </div>

        {/* Account Privacy Section */}
        <div>
          <label className="text-sm font-medium text-slate-700">{t('accountPrivacy')}</label>
          <select
            name="account_privacy"
            value={formData.account_privacy}
            onChange={handleChange}
            className="mt-1 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">{t('publicAccount')}</option>
            <option value="private">{t('privateAccount')}</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {formData.account_privacy === 'public' ? t('publicAccountDesc') : t('privateAccountDesc')}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">{t('language')}</label>
          <select
            name="preferred_language"
            value={formData.preferred_language}
            onChange={handleChange}
            className="mt-1 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:// ... keep existing code (rest of component) ...
focus-blue-500"
          >
            <option value="en">🇺🇸 English</option>
            <option value="he">🇮🇱 עברית</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Choose your preferred interface language</p>
        </div>

        {isOnboarding && (
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="text-sm">
              <label htmlFor="terms" className="font-medium text-slate-700">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </label>
            </div>
          </div>
        )}

        <Button type="submit" disabled={isSaving || isUploadingAvatar || (isOnboarding && !agreedToTerms) || (isOnboarding && !formData.date_of_birth)} className="w-full py-3 text-base">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isOnboarding ? 'Save & Continue' : t('save'))}
        </Button>
      </form>
    </div>
  );
};
