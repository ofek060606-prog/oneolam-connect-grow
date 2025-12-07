import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTranslation } from '../utils/i18n';

export const FilterPanel = ({ filters, onFilterChange, onApply, onClose }) => {
  const { t } = useTranslation();

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">{t('searchFilters')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Looking For */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('lookingFor')}</label>
            <select
              value={filters.lookingFor}
              onChange={(e) => handleChange('lookingFor', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
            >
              <option value="anyConnection">{t('anyConnection')}</option>
              <option value="newFriends">{t('newFriends')}</option>
              <option value="studyPartners">{t('studyPartners')}</option>
              <option value="dating">{t('dating')}</option>
              <option value="communityLeaders">{t('communityLeaders')}</option>
              <option value="mentorship">{t('mentorship')}</option>
            </select>
          </div>

          {/* Age Range - IMPROVED */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              {t('ageRange')}: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            
            <div className="space-y-4">
              {/* Min Age Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">{t('minAge')}</span>
                  <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {filters.ageRange[0]}
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.ageRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    if (newMin < filters.ageRange[1]) {
                      handleChange('ageRange', [newMin, filters.ageRange[1]]);
                    }
                  }}
                  className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-purple-500 [&::-moz-range-thumb]:to-pink-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                />
              </div>

              {/* Max Age Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">{t('maxAge')}</span>
                  <span className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                    {filters.ageRange[1]}
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.ageRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    if (newMax > filters.ageRange[0]) {
                      handleChange('ageRange', [filters.ageRange[0], newMax]);
                    }
                  }}
                  className="w-full h-3 bg-gradient-to-r from-pink-200 to-pink-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-pink-500 [&::-moz-range-thumb]:to-purple-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                />
              </div>
            </div>

            {/* Visual Age Range Display */}
            <div className="mt-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-4 border-2 border-purple-100">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">{filters.ageRange[0]}</span>
                <span className="text-slate-400">—</span>
                <span className="text-2xl font-bold text-pink-600">{filters.ageRange[1]}</span>
                <span className="text-sm text-slate-600 font-medium">years old</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('location')}</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Tel Aviv, New York..."
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('gender')}</label>
            <select
              value={filters.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
            >
              <option value="any">{t('anyGender')}</option>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          {/* Observance Level */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('observanceLevel')}</label>
            <select
              value={filters.observanceLevel}
              onChange={(e) => handleChange('observanceLevel', e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
            >
              <option value="any">{t('anyLevel')}</option>
              <option value="secular">{t('secular')}</option>
              <option value="traditional">{t('traditional')}</option>
              <option value="conservative">{t('conservative')}</option>
              <option value="orthodox">{t('orthodox')}</option>
              <option value="reform">{t('reform')}</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t-2 border-slate-100 p-6 space-y-3 rounded-b-3xl">
          <Button
            onClick={onApply}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {t('applyFilters')}
          </Button>
          <Button
            onClick={() => {
              onFilterChange({
                lookingFor: 'anyConnection',
                ageRange: [18, 60],
                location: '',
                gender: 'any',
                observanceLevel: 'any'
              });
            }}
            variant="outline"
            className="w-full border-2 border-slate-200 hover:border-purple-300 py-4 rounded-2xl font-semibold"
          >
            {t('clearAll')}
          </Button>
        </div>
      </div>
    </div>
  );
};