import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import { ROLE_DEFINITIONS, Player } from '@werewolf/shared';
import {
  Moon,
  Sparkles,
  Shield,
  Heart,
  Eye,
  Crosshair,
  Check,
  AlertCircle,
  FlaskConical,
  Skull,
  UserCheck,
} from 'lucide-react';

export const NightView: React.FC = () => {
  const { roomState, me, performNightAction } = useGame();

  // Local selection states for night actions
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [secondTargetId, setSecondTargetId] = useState<string | null>(null);
  const [witchActionState, setWitchActionState] = useState<'IDLE' | 'SAVING' | 'POISONING'>('IDLE');
  const [actionConfirmed, setActionConfirmed] = useState<boolean>(false);

  if (!roomState || !me) return null;

  const livingPlayers = roomState.players.filter((p) => p.isAlive);
  const roleDef = me.role ? ROLE_DEFINITIONS[me.role] : null;

  // Check if it's the current player's night subphase or if their role is active
  // If roomState.nightSubPhase is set, match against it.
  const isMySubPhase =
    !roomState.nightSubPhase ||
    roomState.nightSubPhase === me.role ||
    (me.role === 'WEREWOLF' && roomState.nightSubPhase === 'WEREWOLF');

  const canAct = me.isAlive && roleDef?.hasNightAction && isMySubPhase;

  // Handle card selection based on role
  const handleCardClick = (target: Player) => {
    if (!canAct || actionConfirmed) return;

    if (me.role === 'CUPID') {
      // Cupid chooses 2 players
      if (!selectedTargetId) {
        setSelectedTargetId(target.id);
      } else if (selectedTargetId === target.id) {
        setSelectedTargetId(null);
      } else if (!secondTargetId) {
        setSecondTargetId(target.id);
      } else if (secondTargetId === target.id) {
        setSecondTargetId(null);
      } else {
        // Replace second target
        setSecondTargetId(target.id);
      }
    } else if (me.role === 'WITCH') {
      if (witchActionState === 'POISONING') {
        setSelectedTargetId(target.id);
      }
    } else if (me.role === 'BODYGUARD') {
      // Bodyguard cannot protect same target consecutively
      if (me.targetPlayerId === target.id) {
        return; // blocked
      }
      setSelectedTargetId(target.id === selectedTargetId ? null : target.id);
    } else {
      // Werewolf, Seer
      setSelectedTargetId(target.id === selectedTargetId ? null : target.id);
    }
  };

  // Submit action to server
  const handleConfirmAction = () => {
    if (!me.role) return;

    if (me.role === 'WEREWOLF') {
      if (selectedTargetId) {
        performNightAction('WEREWOLF_KILL', selectedTargetId);
        setActionConfirmed(true);
      }
    } else if (me.role === 'SEER') {
      if (selectedTargetId) {
        performNightAction('SEER_CHECK', selectedTargetId);
        setActionConfirmed(true);
      }
    } else if (me.role === 'BODYGUARD') {
      if (selectedTargetId) {
        performNightAction('BODYGUARD_PROTECT', selectedTargetId);
        setActionConfirmed(true);
      }
    } else if (me.role === 'CUPID') {
      if (selectedTargetId && secondTargetId) {
        performNightAction('CUPID_CHOOSE', selectedTargetId, secondTargetId);
        setActionConfirmed(true);
      }
    } else if (me.role === 'WITCH') {
      if (witchActionState === 'SAVING') {
        performNightAction('WITCH_SAVE');
        setActionConfirmed(true);
      } else if (witchActionState === 'POISONING' && selectedTargetId) {
        performNightAction('WITCH_POISON', selectedTargetId);
        setActionConfirmed(true);
      } else {
        performNightAction('WITCH_SKIP');
        setActionConfirmed(true);
      }
    }
  };

  const handleWitchSkip = () => {
    performNightAction('WITCH_SKIP');
    setActionConfirmed(true);
  };

  // Target victim attacked by wolf (visible to Witch)
  const wolfVictim = roomState.nightVictims?.wolfVictimId
    ? roomState.players.find((p) => p.id === roomState.nightVictims.wolfVictimId)
    : null;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Night Atmosphere Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-3 sm:p-4 border border-indigo-900/60 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-900/80 border border-indigo-500/40 text-indigo-300">
              <Moon className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Màn Đêm Thứ {roomState.dayNumber}</span>
                {roleDef && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-800/80 text-amber-300 border border-amber-500/30">
                    {roleDef.nameVi}
                  </span>
                )}
              </h2>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                {canAct ? roleDef?.actionVi : 'Cả làng đang chìm vào giấc ngủ sâu. Hãy giữ bí mật...'}
              </p>
            </div>
          </div>

          {/* Quick action trigger button if active */}
          {canAct && !actionConfirmed && (
            <button
              onClick={handleConfirmAction}
              disabled={
                (me.role === 'CUPID' && (!selectedTargetId || !secondTargetId)) ||
                (me.role === 'WEREWOLF' && !selectedTargetId) ||
                (me.role === 'SEER' && !selectedTargetId) ||
                (me.role === 'BODYGUARD' && !selectedTargetId) ||
                (me.role === 'WITCH' && witchActionState === 'POISONING' && !selectedTargetId)
              }
              className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận</span>
            </button>
          )}

          {actionConfirmed && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đã chọn</span>
            </div>
          )}
        </div>

        {/* Role-Specific Action Controls Bar */}
        {canAct && me.role === 'WITCH' && !actionConfirmed && (
          <div className="mt-3 pt-3 border-t border-indigo-900/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-300">Phù Thủy hành động:</span>

            {/* Save Potion button */}
            <button
              onClick={() => {
                setWitchActionState('SAVING');
                performNightAction('WITCH_SAVE');
                setActionConfirmed(true);
              }}
              disabled={!roomState.witchInventory?.hasSavePotion || !wolfVictim}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-200 disabled:opacity-40 flex items-center gap-1"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cứu {wolfVictim ? wolfVictim.name : '(Không ai bị cắn)'}</span>
            </button>

            {/* Poison Potion button */}
            <button
              onClick={() => setWitchActionState('POISONING')}
              disabled={!roomState.witchInventory?.hasPoisonPotion}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                witchActionState === 'POISONING'
                  ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-300'
                  : 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/40 text-purple-200 disabled:opacity-40'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span>Dùng Bình Độc (Chọn thẻ bài)</span>
            </button>

            {/* Skip button */}
            <button
              onClick={handleWitchSkip}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700"
            >
              Không dùng thuốc đêm nay
            </button>
          </div>
        )}

        {/* Cupid 2 Targets Prompt */}
        {canAct && me.role === 'CUPID' && (
          <div className="mt-2 text-xs text-pink-300 font-medium flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span>
              Chọn 2 thẻ bài: {selectedTargetId ? 'Đã chọn 1' : 'Chưa chọn'}
              {secondTargetId ? ' & Đã chọn 2' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Sleep Screen for Inactive / Dead / Sleeping Players */}
      {!canAct && (
        <div className="rounded-2xl bg-gradient-to-b from-[#121320] to-[#0d0e17] border border-gray-800/70 p-4 text-center my-1">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-gray-200">
            {me.isAlive ? 'Bạn Đang Ngủ Say...' : 'Linh Hồn Lang Thang'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            {me.isAlive
              ? 'Tiếng sói hú vang vọng ngoài ô cửa... Các nhân vật quyền năng đang thức giấc để thi triển phép thuật.'
              : 'Bạn đã rời khỏi trần thế. Bạn có thể theo dõi diễn biến trận đấu và trò chuyện cùng những linh hồn khác.'}
          </p>
        </div>
      )}

      {/* 2-COLUMN CARD GRID OPTIMIZED FOR MOBILE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {roomState.players.map((player) => {
          const isSelected = selectedTargetId === player.id;
          const isSecond = secondTargetId === player.id;
          const isMe = player.id === me.id;

          // Werewolves see who other wolves are targeting
          const isWolfTarget =
            me.role === 'WEREWOLF' &&
            roomState.nightVictims?.wolfVictimId === player.id;

          // Badge on cards for Cupid
          let badge: string | undefined = undefined;
          if (isSelected && me.role === 'CUPID') badge = 'Người Yêu 1';
          if (isSecond && me.role === 'CUPID') badge = 'Người Yêu 2';
          if (isSelected && me.role === 'SEER') badge = 'Soi Thân Phận';
          if (isSelected && me.role === 'BODYGUARD') badge = 'Bảo Vệ';
          if (isSelected && me.role === 'WEREWOLF') badge = 'Cắn Xé';
          if (isSelected && witchActionState === 'POISONING') badge = 'Đầu Độc';

          const selectable =
            canAct &&
            player.isAlive &&
            !actionConfirmed &&
            !(me.role === 'BODYGUARD' && me.targetPlayerId === player.id);

          return (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={isMe}
              isSelected={isSelected}
              isSecondSelected={isSecond}
              isSelectable={selectable}
              isWolfTarget={isWolfTarget}
              selectionBadge={badge}
              showRole={
                roomState.phase === 'GAME_OVER' ||
                (me.role === 'WEREWOLF' && player.role === 'WEREWOLF') ||
                isMe
              }
              onClick={() => handleCardClick(player)}
            />
          );
        })}
      </div>
    </div>
  );
};
