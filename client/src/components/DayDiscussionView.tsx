import React from 'react';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import { Sun, Skull, ShieldCheck, MessageCircle, AlertTriangle } from 'lucide-react';
import { ROLE_DEFINITIONS } from '@werewolf/shared';

export const DayDiscussionView: React.FC = () => {
  const { roomState, me, setActiveTab } = useGame();

  if (!roomState || !me) return null;

  const deaths = roomState.lastNightDeaths || [];
  const hadDeaths = deaths.length > 0;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Day Announcement Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/70 p-3 sm:p-4 border border-amber-900/60 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-900/80 border border-amber-500/40 text-amber-300">
              <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Bình Minh Ngày Thứ {roomState.dayNumber}</span>
              </h2>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Mặt trời đã lên. Hãy trao đổi và tìm ra kẻ mạo danh Ma Sói trước khi giờ bỏ phiếu bắt đầu!
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('chat')}
            className="sm:hidden px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 flex items-center gap-1 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Vào Chat</span>
          </button>
        </div>

        {/* Morning Death Bulletin */}
        <div className="mt-3 pt-3 border-t border-amber-900/50">
          {hadDeaths ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <Skull className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Nạn nhân đêm qua ({deaths.length} người ngã xuống):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {deaths.map((d) => {
                  const roleDef = d.role ? ROLE_DEFINITIONS[d.role] : null;
                  return (
                    <div
                      key={d.playerId}
                      className="px-2.5 py-1 rounded-xl bg-red-950/90 border border-red-500/40 text-xs font-semibold text-red-200 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="font-bold text-white">{d.playerName}</span>
                      {roleDef && (
                        <span className="text-[11px] text-amber-300 bg-red-900/80 px-1.5 py-0.2 rounded">
                          ({roleDef.nameVi})
                        </span>
                      )}
                      <span className="text-gray-400 text-[11px]">({d.reason})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 p-2 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Đêm qua là một đêm bình yên tuyệt đối! Không có ai bị sát hại.</span>
            </div>
          )}
        </div>
      </div>

      {/* 2-COLUMN CARD GRID OPTIMIZED FOR MOBILE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {roomState.players.map((player) => {
          const isMe = player.id === me.id;

          return (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={isMe}
              showRole={!player.isAlive || roomState.phase === 'GAME_OVER'}
            />
          );
        })}
      </div>
    </div>
  );
};
