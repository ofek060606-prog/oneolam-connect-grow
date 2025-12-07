import React from 'react';
import { Image, Video } from 'lucide-react';

export const ProfilePostGridItem = ({ post }) => {
    const handlePostClick = () => {
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'post-detail', postId: post.id } }));
    };

    return (
        <button 
            onClick={handlePostClick} 
            className="relative aspect-square bg-slate-200 rounded-md overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {post.image_url ? (
                <img src={post.image_url} alt="Post" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            ) : post.video_url ? (
                <>
                    <video src={post.video_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" muted loop playsInline />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-10 h-10 text-slate-400" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
    );
};