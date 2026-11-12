import React from 'react';
import { Player, ROLE_DEFINITIONS } from '@werewolf/shared';
import {
  Skull,
  Heart,
  Crown,
  Shield,
  Sparkles,
  CheckCircle2,
  Crosshair,
  Bot,
  X,
} from 'lucide-react';
import { cn } from '../utils/helpers';

interface PlayerCardProps {
  player: Player;
  isMe?: boolean;
  isSelected?: boolean;
  isSecondSelected?: boolean;
  isSelectable?: boolean;
  showRole?: boolean;
  isWolfTarget?: boolean;
  voteCount?: number;
  voterNames?: string[];
  onClick?: () => void;
  selectionBadge?: string;
  onRemoveBot?: () => void;
  canRemoveBot?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isMe = false,
  isSelected = false,
  isSecondSelected = false,
  isSelectable = false,
  showRole = false,
  isWolfTarget = false,
  voteCount = 0,
  voterNames = [],
  onClick,
  selectionBadge,
  onRemoveBot,
  canRemoveBot = false,
}) => {
  const roleDef = player.role ? ROLE_DEFINITIONS[player.role] : null;

  // Determine border glow style
  const getBorderGlow = () => {
    if (!player.isAlive) {
      return 'border-gray-800 bg-gray-950/60 opacity-60';
    }
    if (isSelected || isSecondSelected) {
      return 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.6)] bg-[#1e1c2e]';
    }
    if (isWolfTarget) {
      return 'border-red-500 ring-2 ring-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.5)] bg-[#241419]';
    }
    if (showRole && roleDef) {
      return `border-[${roleDef.borderGlowColor}] shadow-md bg-[#161623]`;
    }
    if (isMe) {
      return 'border-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.3)] bg-[#181827]';
    }
    return 'border-gray-800/90 hover:border-gray-700 bg-[#14141f]';
  };

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={cn(
        'relative group rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 border-2 select-none',
        'w-full aspect-[4/5] sm:aspect-[3/4] max-w-[200px] mx-auto',
        getBorderGlow(),
        isSelectable && player.isAlive
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95'
          : 'cursor-default',
        !player.isAlive && 'filter grayscale-[80%]'
      )}
    >
      {/* Top Bar on the Card: Role Icon or Dead Skull & Badges */}
      <div className="flex items-start justify-between gap-1 w-full z-10">
        {/* Status Indicator */}
        <div className="flex flex-wrap gap-1">
          {player.isAlive ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sống
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/90 text-red-400 border border-red-500/40">
              <Skull className="w-2.5 h-2.5" />
              Chết
            </span>
          )}

          {/* Mayor Badge */}
          {player.isMayor && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 shadow-sm"
              title="Thị trưởng làng (Phiếu bầu tính gấp đôi)"
            >
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              Thị Trưởng
            </span>
          )}

          {/* Lover Badge */}
          {player.isLover && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-950/90 text-pink-300 border border-pink-500/40 animate-pulse"
              title="Cặp đôi tình nhân (Chết cùng nhau)"
            >
              <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
            </span>
          )}

          {/* Protected Badge */}
          {player.isProtected && player.isAlive && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/90 text-blue-300 border border-blue-500/40"
              title="Được Bảo vệ đêm nay"
            >
              <Shield className="w-2.5 h-2.5 text-blue-400" />
            </span>
          )}

          {/* Bot Indicator Badge */}
          {player.isBot && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-500/40"
              title="Người chơi tự động (Bot)"
            >
              <Bot className="w-2.5 h-2.5 text-purple-400" />
              Bot
            </span>
          )}
        </div>

        {/* Remove Bot Button (Lobby only) */}
        {player.isBot && canRemoveBot && onRemoveBot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBot();
            }}
            className="p-1 rounded-full bg-red-950/90 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white transition-all shadow-md z-20"
            title="Đuổi bot này"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Wolf Target Indicator Badge */}
        {isWolfTarget && player.isAlive && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-bounce shadow-lg">
            🐺 Nạn nhân
          </span>
        )}

        {/* Custom Selection Badge (e.g. "Người 1", "Người 2", "Soi", "Cứu") */}
        {selectionBadge && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-gray-950 shadow-md">
            {selectionBadge}
          </span>
        )}
      </div>

      {/* Card Center: Chibi Avatar with frame */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-1 z-0">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Avatar Ring */}
          <div
            className={cn(
              'absolute inset-0 rounded-2xl bg-gradient-to-b from-gray-700/30 to-gray-900/60 border border-gray-700/50 shadow-inner',
              isSelected && 'from-amber-500/30 to-amber-700/40 border-amber-400',
              !player.isAlive && 'opacity-40'
            )}
          />

          <img
            src={player.avatar}
            alt={player.name}
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover transition-transform duration-300',
              player.isAlive ? 'group-hover:scale-105' : 'grayscale opacity-50'
            )}
            loading="lazy"
          />

          {/* Skull overlay for dead players */}
          {!player.isAlive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <Skull className="w-8 h-8 text-red-500/90 animate-pulse" />
            </div>
          )}

          {/* Selection Checkmark Icon */}
          {(isSelected || isSecondSelected) && player.isAlive && (
            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-950 rounded-full p-0.5 shadow-lg animate-scale">
              <CheckCircle2 className="w-4 h-4 fill-amber-400 text-gray-950" />
            </div>
          )}

          {/* Selectable crosshair hint on hover */}
          {isSelectable && player.isAlive && !isSelected && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-amber-500/10 rounded-xl transition-opacity">
              <Crosshair className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          )}
        </div>

        {/* Realtime Vote Count Chip */}
        {voteCount > 0 && (
          <div
            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-lg animate-pulse ring-2 ring-red-400/80"
            title={`Người vote: ${voterNames.join(', ')}`}
          >
            <span>🗳️ {voteCount} phiếu</span>
          </div>
        )}
      </div>

      {/* Card Bottom: Player Name & Role Reveal (if applicable) */}
      <div className="w-full text-center z-10 pt-1 border-t border-gray-800/60">
        <div className="flex items-center justify-center gap-1">
          {player.isBot && <Bot className="w-3 h-3 text-purple-400 shrink-0" />}
          <p
            className={cn(
              'text-xs sm:text-sm font-bold truncate max-w-[120px]',
              isMe ? 'text-indigo-300' : 'text-gray-200'
            )}
            title={player.name}
          >
            {player.name}
          </p>
          {isMe && (
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/80 px-1 rounded">
              Bạn
            </span>
          )}
        </div>

        {/* Revealed Role Name & Icon (when dead or game over or revealed to seer/self) */}
        {showRole && roleDef && (
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-bold text-amber-400/90">
            <span>{roleDef.icon}</span>
            <span className="truncate">{roleDef.nameVi.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
