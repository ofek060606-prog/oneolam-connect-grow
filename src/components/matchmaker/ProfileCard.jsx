import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, GraduationCap, Star, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

export const ProfileCard = ({ user, onVote, onSuperSwipe, isProcessing }) => {
    const { t } = useTranslation();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    // Build photo gallery: avatar + additional photos
    const photos = [
        user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}&size=512&background=random`,
        ...(user.photo_gallery || [])
    ].filter(Boolean);

    const nextPhoto = () => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm mx-auto"
        >
            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Photo Section with Gallery */}
                <div className="relative h-[500px] bg-gradient-to-br from-purple-100 to-pink-100">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentPhotoIndex}
                            src={photos[currentPhotoIndex]}
                            alt={user.full_name}
                            className="w-full h-full object-cover"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        />
                    </AnimatePresence>

                    {/* Photo Navigation */}
                    {photos.length > 1 && (
                        <>
                            {/* Navigation Buttons */}
                            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                                {currentPhotoIndex > 0 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={prevPhoto}
                                        className="pointer-events-auto w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-slate-800" />
                                    </motion.button>
                                )}
                                <div className="flex-1"></div>
                                {currentPhotoIndex < photos.length - 1 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={nextPhoto}
                                        className="pointer-events-auto w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                                    >
                                        <ChevronRight className="w-6 h-6 text-slate-800" />
                                    </motion.button>
                                )}
                            </div>

                            {/* Photo Indicators (Dots) */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                                {photos.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPhotoIndex(index)}
                                        className={`transition-all ${
                                            index === currentPhotoIndex
                                                ? 'w-8 h-2 bg-white shadow-lg'
                                                : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                                        } rounded-full`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Info Button */}
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                    >
                        <Info className="w-5 h-5 text-slate-800" />
                    </button>

                    {/* Name & Age - Bottom Left */}
                    <div className="absolute bottom-6 left-6 text-white">
                        <h2 className="text-4xl font-bold mb-1 drop-shadow-lg">
                            {user.full_name}
                        </h2>
                        <div className="flex items-center space-x-3 text-lg">
                            <span className="font-semibold">{user.age} years old</span>
                            {user.location && (
                                <>
                                    <span className="text-white/60">•</span>
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{user.location}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Section - Expandable */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 space-y-4 bg-gradient-to-br from-purple-50 to-pink-50">
                                {/* Bio */}
                                {user.bio && (
                                    <div>
                                        <p className="text-slate-700 leading-relaxed">{user.bio}</p>
                                    </div>
                                )}

                                {/* Interests */}
                                {user.interests && user.interests.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                                            <Star className="w-4 h-4 mr-2 text-purple-500" />
                                            Interests
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {user.interests.map((interest, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm font-medium shadow-sm"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Languages */}
                                {user.spoken_languages && user.spoken_languages.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                                            <GraduationCap className="w-4 h-4 mr-2 text-pink-500" />
                                            Languages
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {user.spoken_languages.map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-white text-pink-700 rounded-full text-sm font-medium shadow-sm"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};