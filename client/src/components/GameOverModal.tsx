import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import { VICTORY_MESSAGES, ROLE_DEFINITIONS } from '@werewolf/shared';
import { Trophy, RotateCcw, Users, Heart } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { roomState, me, restartGame } = useGame();

  useEffect(() => {
    if (roomState?.phase === 'GAME_OVER') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  }, [roomState?.phase]);

  if (!roomState || roomState.phase !== 'GAME_OVER') return null;

  const winner = roomState.winner;
  const isHost = me?.isHost;

  const getWinnerDisplay = () => {
    switch (winner) {
      case 'WEREWOLF':
        return {
          title: 'Phe Ma Sói Chiến Thắng!',
          desc: VICTORY_MESSAGES.WEREWOLF,
          bg: 'from-red-950 via-slate-900 to-red-900',
          border: 'border-red-600',
          textColor: 'text-red-400',
        };
      case 'VILLAGE':
        return {
          title: 'Phe Dân Làng Chiến Thắng!',
          desc: VICTORY_MESSAGES.VILLAGE,
          bg: 'from-emerald-950 via-slate-900 to-teal-900',
          border: 'border-emerald-600',
          textColor: 'text-emerald-400',
        };
      case 'LOVERS':
        return {
          title: 'Phe Cặp Đôi Chiến Thắng!',
          desc: VICTORY_MESSAGES.LOVERS,
          bg: 'from-pink-950 via-slate-900 to-rose-900',
          border: 'border-pink-600',
          textColor: 'text-pink-400',
        };
      default:
        return {
          title: 'Trò Chơi Kết Thúc!',
          desc: roomState.winReason || 'Ván đấu đã khép lại.',
          bg: 'from-indigo-950 via-slate-900 to-purple-900',
          border: 'border-indigo-600',
          textColor: 'text-indigo-400',
        };
    }
  };

  const display = getWinnerDisplay();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in">
      <div className={`relative w-full max-w-3xl rounded-3xl bg-gradient-to-b ${display.bg} border-2 ${display.border} shadow-2xl p-5 sm:p-6 text-center my-8`}>
        {/* Victory Trophy */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shadow-lg">
          <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
        </div>

        <h2 className={`text-xl sm:text-2xl font-black ${display.textColor} tracking-wide`}>
          {display.title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto mt-1 leading-relaxed">
          {display.desc}
        </p>

        {/* All Players Role Reveal Gallery */}
        <div className="my-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Thân Phận Thật Của Mọi Người Chơi</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {roomState.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isMe={player.id === me?.id}
                showRole={true}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-800/80">
          {isHost ? (
            <button
              onClick={restartGame}
              className="px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Ván Mới (Phòng Chờ)</span>
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              Đang chờ Chủ phòng bắt đầu ván mới...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
