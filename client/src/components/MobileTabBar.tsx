import React from 'react';
import { useGame } from '../context/GameContext';
import { Layers, MessageSquare, ScrollText, Moon } from 'lucide-react';
import { cn } from '../utils/helpers';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, unreadChat, clearUnreadChat, roomState, me } = useGame();

  if (!roomState || roomState.phase === 'LOBBY') return null;

  const handleTabChange = (tab: 'cards' | 'chat' | 'logs') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      clearUnreadChat();
    }
  };

  const isNight = roomState.phase === 'NIGHT';
  const livingCount = roomState.players.filter((p) => p.isAlive).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#10111c]/95 backdrop-blur-md border-t border-gray-800/80 px-4 py-2 sm:hidden transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Bàn bài (Cards) */}
        <button
          onClick={() => handleTabChange('cards')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all relative',
            activeTab === 'cards'
              ? 'text-amber-400 font-extrabold bg-amber-500/10'
              : 'text-gray-400 font-medium hover:text-gray-200'
          )}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            {isNight && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px]">Bàn Bài ({livingCount})</span>
        </button>

        {/* Tab 2: Trò chuyện (Chat) */}
        <button
          onClick={() => handleTabChange('chat')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all relative',
            activeTab === 'chat'
              ? 'text-indigo-400 font-extrabold bg-indigo-500/10'
              : 'text-gray-400 font-medium hover:text-gray-200'
          )}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadChat > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-red-600 text-[10px] font-black text-white animate-bounce shadow">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </div>
          <span className="text-[11px]">Trò Chuyện</span>
        </button>

        {/* Tab 3: Nhật ký (Logs) */}
        <button
          onClick={() => handleTabChange('logs')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all relative',
            activeTab === 'logs'
              ? 'text-emerald-400 font-extrabold bg-emerald-500/10'
              : 'text-gray-400 font-medium hover:text-gray-200'
          )}
        >
          <ScrollText className="w-5 h-5" />
          <span className="text-[11px]">Nhật Ký</span>
        </button>
      </div>
    </nav>
  );
};
