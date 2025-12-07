import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

export const UserCard = ({ user, onConnect, onChat }) => {
    const [isConnected, setIsConnected] = useState(false);
    const { t } = useTranslation();

    const handleConnectClick = () => {
        setIsConnected(true);
        onConnect(user);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 flex flex-col items-center text-center">
            <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}`} 
                alt={user.full_name}
                className="w-20 h-20 rounded-full mb-3 object-cover shadow-sm"
            />
            <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
            <p className="text-sm text-slate-500 mb-2">{user.location || t('member')}</p>
            <p className="text-sm text-slate-600 h-10 line-clamp-2 mb-4">{user.bio}</p>
            
            <div className="flex w-full space-x-2">
                <Button 
                    onClick={handleConnectClick} 
                    disabled={isConnected}
                    variant={isConnected ? "outline" : "default"}
                    className="flex-1"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isConnected ? t('connected') : t('connect')}
                </Button>
                <Button onClick={() => onChat(user)} variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('message')}
                </Button>
            </div>
        </div>
    );
};