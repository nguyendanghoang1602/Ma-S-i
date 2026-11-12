import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Crosshair, Skull, CheckCircle } from 'lucide-react';
import { Player } from '@werewolf/shared';

export const HunterRevengeModal: React.FC = () => {
  const { roomState, me, hunterShoot } = useGame();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  if (!roomState || !roomState.hunterPending) return null;

  const isMeHunter = roomState.hunterPending.hunterId === me?.id;
  const livingTargets = roomState.players.filter((p) => p.isAlive && p.id !== me?.id);

  const handleShoot = () => {
    if (selectedTargetId) {
      hunterShoot(selectedTargetId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1a1215] border-2 border-red-600 shadow-2xl p-5 text-center">
        <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-red-950/90 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
          <Crosshair className="w-8 h-8" />
        </div>

        <h3 className="text-xs font-black uppercase tracking-widest text-red-400">
          Phát Súng Trăn Trối Của Thợ Săn!
        </h3>
        <h4 className="text-base font-extrabold text-white mt-1">
          {isMeHunter
            ? 'Bạn đã chết! Hãy kéo theo 1 kẻ thù cùng xuống mồ!'
            : `${roomState.hunterPending.hunterName} đang ngắm bắn phát súng cuối cùng...`}
        </h4>

        {isMeHunter ? (
          <div className="my-4">
            <p className="text-xs text-gray-300 mb-3">
              Chọn 1 người chơi còn sống để bắn chết ngay lập tức:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {livingTargets.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTargetId(player.id)}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                    selectedTargetId === player.id
                      ? 'bg-red-600 text-white border-red-400 ring-2 ring-red-400'
                      : 'bg-gray-900/80 text-gray-200 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-xs font-bold truncate">{player.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleShoot}
              disabled={!selectedTargetId}
              className="mt-4 w-full py-2.5 rounded-xl font-black text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              <Skull className="w-4 h-4" />
              <span>Bóp Cò Bắn Ngay</span>
            </button>
          </div>
        ) : (
          <div className="my-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
            <p className="text-xs text-gray-400">
              Cả làng đang nín thở chờ phát súng định mệnh vang lên...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
