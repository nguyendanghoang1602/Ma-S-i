import React from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_DEFINITIONS } from '@werewolf/shared';
import { X, ShieldAlert, Sparkles, Heart } from 'lucide-react';
import { cn } from '../utils/helpers';

export const RolePeekModal: React.FC = () => {
  const { isRoleDrawerOpen, setIsRoleDrawerOpen, me, roomState } = useGame();

  if (!isRoleDrawerOpen || !me || !me.role) return null;

  const roleDef = ROLE_DEFINITIONS[me.role];

  // Check if player is a lover
  const loverPartner = me.isLover && roomState?.lovers
    ? roomState.players.find((p) => p.id !== me.id && roomState.lovers?.includes(p.id))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#141525] border-2 border-indigo-500/50 shadow-2xl p-5 overflow-hidden text-center">
        {/* Close Button */}
        <button
          onClick={() => setIsRoleDrawerOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
          Lá Bài Bí Mật Của Bạn
        </h3>

        {/* Large Playing Card Style */}
        <div
          className={cn(
            'relative mx-auto my-3 w-48 aspect-[3/4] rounded-2xl p-3 flex flex-col justify-between items-center border-2 shadow-2xl',
            'bg-gradient-to-b from-[#1c1d33] to-[#111222]',
            `border-[${roleDef.borderGlowColor}] shadow-[0_0_25px_rgba(99,102,241,0.4)]`
          )}
        >
          {/* Top of Card */}
          <div className="w-full flex items-center justify-between">
            <span className="text-2xl">{roleDef.icon}</span>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              Phe {roleDef.team === 'WEREWOLF' ? 'Ma Sói' : roleDef.team === 'VILLAGE' ? 'Dân Làng' : 'Tự Do'}
            </span>
          </div>

          {/* Center Chibi Avatar */}
          <div className="relative my-auto flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-purple-500/20 p-2 border border-indigo-500/40 shadow-inner flex items-center justify-center">
              <img
                src={me.avatar}
                alt={me.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            </div>
            <h4 className="mt-2 text-base font-extrabold text-amber-300 tracking-wide">
              {roleDef.nameVi}
            </h4>
          </div>

          {/* Bottom Card details */}
          <div className="w-full text-center">
            <span className="text-[10px] text-gray-400 font-mono">
              Ma Sói Card Edition
            </span>
          </div>
        </div>

        {/* Lover info if applicable */}
        {loverPartner && (
          <div className="my-2 p-2 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs font-bold text-pink-300 flex items-center justify-center gap-1.5 animate-pulse">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span>Người yêu của bạn: {loverPartner.name}</span>
          </div>
        )}

        {/* Detailed Description */}
        <div className="mt-3 text-left bg-gray-900/80 p-3 rounded-2xl border border-gray-800">
          <p className="text-xs text-gray-300 leading-relaxed">
            {roleDef.descriptionVi}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-amber-300/90 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Kỹ năng: {roleDef.actionVi}</span>
          </div>
        </div>

        <button
          onClick={() => setIsRoleDrawerOpen(false)}
          className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 transition-all"
        >
          Đã Hiểu & Đóng
        </button>
      </div>
    </div>
  );
};
