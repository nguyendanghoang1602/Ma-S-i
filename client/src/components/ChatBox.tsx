import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ChatChannel, ROLE_DEFINITIONS } from '@werewolf/shared';
import { Send, Users, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '../utils/helpers';

export const ChatBox: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const { roomState, me, sendChatMessage } = useGame();
  const [activeChannel, setActiveChannel] = useState<'ALL' | 'WEREWOLF'>('ALL');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isWerewolf = me?.role === 'WEREWOLF';
  const isNight = roomState?.phase === 'NIGHT';

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState?.messages, activeChannel]);

  if (!roomState || !me) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    sendChatMessage(activeChannel, trimmed);
    setInputText('');
  };

  const handleQuickChat = (text: string) => {
    sendChatMessage(activeChannel, text);
  };

  // Filter messages based on active channel
  const filteredMessages = (roomState.messages || []).filter((msg) => {
    if (activeChannel === 'WEREWOLF') {
      return msg.channel === 'WEREWOLF';
    }
    // 'ALL' channel shows public messages and system logs
    return msg.channel === 'ALL' || msg.channel === 'SYSTEM';
  });

  const quickPhrases = [
    'Tôi là Dân Làng!',
    'Tôi nghi ngờ bạn đấy!',
    'Bảo vệ hãy bảo vệ Tiên Tri!',
    'Đừng vote tôi, tôi có vai trò quan trọng!',
    'Hãy tin tôi đi!',
  ];

  return (
    <div
      className={cn(
        'flex flex-col bg-[#11121d] rounded-2xl border border-gray-800/80 shadow-2xl overflow-hidden',
        isEmbedded ? 'h-full' : 'h-[calc(100vh-140px)] sm:h-[600px]'
      )}
    >
      {/* Tab Header: Public vs Secret Werewolf Channel */}
      <div className="flex items-center justify-between bg-[#151625] px-3 py-2 border-b border-gray-800/80">
        <div className="flex items-center gap-1.5">
          {/* Public Chat Tab */}
          <button
            onClick={() => setActiveChannel('ALL')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeChannel === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Phòng Chung</span>
          </button>

          {/* Secret Werewolf Chat Tab (Only visible to Werewolves!) */}
          {isWerewolf && (
            <button
              onClick={() => setActiveChannel('WEREWOLF')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                activeChannel === 'WEREWOLF'
                  ? 'bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400'
                  : 'text-red-400/80 hover:text-red-300 hover:bg-red-950/40'
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Kênh Sói Bí Mật 🐺</span>
            </button>
          )}
        </div>

        {activeChannel === 'WEREWOLF' && (
          <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/30">
            Chỉ bầy sói nhìn thấy
          </span>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-gray-400" />
            <p className="text-xs">Chưa có tin nhắn nào trong kênh này.</p>
            <p className="text-[11px] text-gray-600 mt-1">
              Hãy gửi tin nhắn đầu tiên để cùng thảo luận!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === me.id;
            const isSystem = msg.channel === 'SYSTEM' || msg.isSystem;
            const sender = roomState.players.find((p) => p.id === msg.senderId);

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="mx-auto max-w-sm text-center py-1 px-3 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-amber-300/90 font-medium my-1"
                >
                  <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2 max-w-[85%]',
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Sender Avatar */}
                {sender && (
                  <img
                    src={sender.avatar}
                    alt={sender.name}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-gray-700/80"
                  />
                )}

                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-xs shadow-md break-words',
                    isMe
                      ? activeChannel === 'WEREWOLF'
                        ? 'bg-red-800 text-white rounded-br-xs'
                        : 'bg-indigo-600 text-white rounded-br-xs'
                      : activeChannel === 'WEREWOLF'
                      ? 'bg-red-950/90 text-red-100 border border-red-800/60 rounded-bl-xs'
                      : 'bg-gray-800/90 text-gray-200 border border-gray-700/60 rounded-bl-xs'
                  )}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1 mb-0.5 text-[10px] font-bold text-gray-400">
                      <span>{msg.senderName}</span>
                      {sender?.isMayor && (
                        <span className="text-amber-400">👑 Thị trưởng</span>
                      )}
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chat Bubble Chips */}
      <div className="px-2 py-1.5 bg-[#141524] border-t border-gray-800/50 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPhrases.map((phrase, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickChat(phrase)}
            className="shrink-0 px-2 py-1 rounded-full text-[11px] font-medium bg-gray-800/90 hover:bg-gray-700 active:scale-95 text-gray-300 border border-gray-700/60 transition-all"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-[#151625] border-t border-gray-800/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activeChannel === 'WEREWOLF'
              ? 'Thì thầm với bầy sói...'
              : 'Nhập tin nhắn thảo luận...'
          }
          maxLength={150}
          className="flex-1 bg-gray-900/90 border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={cn(
            'p-2 rounded-xl text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all',
            activeChannel === 'WEREWOLF'
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-indigo-600 hover:bg-indigo-500'
          )}
          title="Gửi tin nhắn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
