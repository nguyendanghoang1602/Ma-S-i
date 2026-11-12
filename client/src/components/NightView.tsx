import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import {
  ROLE_DEFINITIONS,
  Player,
  NIGHT_SUBPHASE_ORDER,
  NightSubPhase,
} from '@werewolf/shared';
import {
  Moon,
  Sparkles,
  Shield,
  Heart,
  Eye,
  Crosshair,
  Check,
  FlaskConical,
  Skull,
  UserCheck,
  CheckCircle,
  Clock,
  Bell,
  Lock,
} from 'lucide-react';
import { cn } from '../utils/helpers';

export const NightView: React.FC = () => {
  const { roomState, me, performNightAction } = useGame();

  // Local selection states for night actions
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [secondTargetId, setSecondTargetId] = useState<string | null>(null);
  const [witchActionState, setWitchActionState] = useState<'IDLE' | 'SAVING' | 'POISONING'>('IDLE');
  const [actionConfirmed, setActionConfirmed] = useState<boolean>(false);

  // Automatically reset action state whenever the night subphase advances
  useEffect(() => {
    setSelectedTargetId(null);
    setSecondTargetId(null);
    setWitchActionState('IDLE');
    setActionConfirmed(false);
  }, [roomState?.nightSubPhase]);

  if (!roomState || !me) return null;

  const currentSubPhase = roomState.nightSubPhase as NightSubPhase | null;
  const roleDef = me.role ? ROLE_DEFINITIONS[me.role] : null;

  // Strict sequential matching: Player can ONLY act if the room's current night subphase exactly matches their role!
  const isMySubPhase = !!currentSubPhase && currentSubPhase === me.role;
  const canAct = me.isAlive && !!roleDef?.hasNightAction && isMySubPhase;

  // Find info of the currently waking role
  const activeStep = NIGHT_SUBPHASE_ORDER.find((s) => s.subPhase === currentSubPhase);
  const currentStepIndex = NIGHT_SUBPHASE_ORDER.findIndex((s) => s.subPhase === currentSubPhase);

  // Handle card selection based on active role
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
        setSecondTargetId(target.id);
      }
    } else if (me.role === 'WITCH') {
      if (witchActionState === 'POISONING') {
        setSelectedTargetId(target.id);
      }
    } else if (me.role === 'BODYGUARD') {
      // Bodyguard cannot protect same target consecutively
      if (me.targetPlayerId === target.id) {
        return;
      }
      setSelectedTargetId(target.id === selectedTargetId ? null : target.id);
    } else {
      // Werewolf, Seer, Hunter
      setSelectedTargetId(target.id === selectedTargetId ? null : target.id);
    }
  };

  // Submit action to server
  const handleConfirmAction = () => {
    if (!canAct) return;

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
    } else if (me.role === 'HUNTER') {
      if (selectedTargetId) {
        performNightAction('HUNTER_AIM', selectedTargetId);
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

  const handleHunterAim = () => {
    if (selectedTargetId) {
      performNightAction('HUNTER_AIM', selectedTargetId);
      setActionConfirmed(true);
    }
  };

  const handleHunterFire = () => {
    if (selectedTargetId) {
      performNightAction('HUNTER_FIRE', selectedTargetId);
      setActionConfirmed(true);
    }
  };

  const handleHunterSkip = () => {
    performNightAction('HUNTER_SKIP');
    setActionConfirmed(true);
  };

  // Target victim attacked by wolf (visible to Witch during her turn)
  const wolfVictim = roomState.nightVictims?.wolfVictimId
    ? roomState.players.find((p) => p.id === roomState.nightVictims.wolfVictimId)
    : null;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* 1. NIGHT SUBPHASE STEPPER / TRACKER (Cupid -> Bodyguard -> Werewolf -> Witch -> Seer -> Hunter) */}
      <div className="rounded-2xl bg-[#111222]/90 border border-indigo-900/50 p-2.5 sm:p-3 shadow-lg">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Thứ Tự Gọi Tên Ban Đêm (Đêm {roomState.dayNumber})</span>
          </div>
          <span className="text-[11px] font-mono text-amber-400 font-bold bg-gray-900/80 px-2 py-0.5 rounded-full border border-gray-800">
            {roomState.timer}s
          </span>
        </div>

        {/* Stepper items 6-column grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
          {NIGHT_SUBPHASE_ORDER.map((step, idx) => {
            const isActive = currentStepIndex === idx;
            const isCompleted = currentStepIndex > idx;
            const isUpcoming = currentStepIndex < idx;

            return (
              <div
                key={step.subPhase}
                className={cn(
                  'relative rounded-xl p-1.5 sm:p-2 text-center transition-all border flex flex-col items-center justify-center min-h-[58px]',
                  isActive &&
                    'bg-gradient-to-b from-amber-500/20 to-amber-900/30 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-102 ring-1 ring-amber-400',
                  isCompleted &&
                    'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 opacity-80',
                  isUpcoming &&
                    'bg-gray-900/40 border-gray-800 text-gray-500 opacity-60'
                )}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm sm:text-base">{step.icon}</span>
                  {isCompleted && (
                    <CheckCircle className="w-3 h-3 text-emerald-400 hidden sm:inline" />
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-bold truncate max-w-full mt-0.5',
                    isActive ? 'text-amber-300' : isCompleted ? 'text-emerald-300' : 'text-gray-400'
                  )}
                >
                  {step.nameVi.split(' ')[0]}
                </span>

                <span className="text-[9px] font-semibold mt-0.5">
                  {isActive ? (
                    <span className="text-amber-400 animate-pulse font-extrabold">Đang thức</span>
                  ) : isCompleted ? (
                    <span className="text-emerald-400">Đã xong</span>
                  ) : (
                    <span className="text-gray-500">Đang ngủ</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE HERO BANNER (When it is CURRENT PLAYER's turn) */}
      {canAct && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-3.5 sm:p-4 border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-inner">
                <Bell className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40 uppercase tracking-wider mb-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  ĐẾN LƯỢT BẠN THỨC GIẤC!
                </div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  {roleDef?.nameVi} ({roomState.timer}s)
                </h2>
                <p className="text-xs text-amber-200/90 mt-0.5 font-medium">
                  {roleDef?.actionVi}
                </p>
              </div>
            </div>

            {/* Confirm action button (for non-Witch, non-Hunter standard roles) */}
            {me.role !== 'WITCH' && me.role !== 'HUNTER' && (
              <>
                {!actionConfirmed ? (
                  <button
                    onClick={handleConfirmAction}
                    disabled={
                      (me.role === 'CUPID' && (!selectedTargetId || !secondTargetId)) ||
                      (me.role === 'WEREWOLF' && !selectedTargetId) ||
                      (me.role === 'SEER' && !selectedTargetId) ||
                      (me.role === 'BODYGUARD' && !selectedTargetId)
                    }
                    className="px-4 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Hành Động</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-black shadow-md">
                    <UserCheck className="w-4 h-4" />
                    <span>Đã thực hiện xong</span>
                  </div>
                )}
              </>
            )}

            {actionConfirmed && (me.role === 'WITCH' || me.role === 'HUNTER') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-black shadow-md">
                <UserCheck className="w-4 h-4" />
                <span>Đã thực hiện xong</span>
              </div>
            )}
          </div>

          {/* Hunter Specific Action Controls */}
          {me.role === 'HUNTER' && !actionConfirmed && (
            <div className="mt-3 pt-3 border-t border-amber-900/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-300">Quyết định của Thợ Săn:</span>

              {/* Aim button */}
              <button
                onClick={handleHunterAim}
                disabled={!selectedTargetId}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 border border-amber-300 disabled:opacity-40 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Ngắm sẵn mục tiêu để kéo theo nếu bạn bị chết đêm nay"
              >
                <Crosshair className="w-3.5 h-3.5 text-gray-950" />
                <span>🎯 Ngắm Sẵn Kéo Theo</span>
              </button>

              {/* Fire button */}
              <button
                onClick={handleHunterFire}
                disabled={!selectedTargetId}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-600 border border-red-400 text-white disabled:opacity-40 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Nổ súng tiêu diệt ngay mục tiêu đêm nay"
              >
                <Skull className="w-3.5 h-3.5 text-red-200" />
                <span>💥 Bắn Hạ Ngay Đêm Nay</span>
              </button>

              {/* Skip button */}
              <button
                onClick={handleHunterSkip}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 active:scale-95 transition-all"
              >
                Bỏ qua đêm nay
              </button>
            </div>
          )}

          {/* Witch Specific Action Controls */}
          {me.role === 'WITCH' && !actionConfirmed && (
            <div className="mt-3 pt-3 border-t border-amber-900/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-300">Quyền năng Phù Thủy:</span>

              {/* Save Potion button */}
              <button
                onClick={() => {
                  setWitchActionState('SAVING');
                  performNightAction('WITCH_SAVE');
                  setActionConfirmed(true);
                }}
                disabled={!roomState.witchInventory?.hasSavePotion || !wolfVictim}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-200 disabled:opacity-40 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cứu {wolfVictim ? wolfVictim.name : '(Không ai bị cắn)'}</span>
              </button>

              {/* Poison Potion button */}
              <button
                onClick={() => setWitchActionState('POISONING')}
                disabled={!roomState.witchInventory?.hasPoisonPotion}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-md active:scale-95 transition-all',
                  witchActionState === 'POISONING'
                    ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-300'
                    : 'bg-purple-950/90 hover:bg-purple-900 border-purple-500/50 text-purple-200 disabled:opacity-40'
                )}
              >
                <Skull className="w-3.5 h-3.5 text-purple-400" />
                <span>Bình Độc (Chạm thẻ bài mục tiêu)</span>
              </button>

              {/* Skip button */}
              <button
                onClick={handleWitchSkip}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 active:scale-95 transition-all"
              >
                Không dùng thuốc
              </button>
            </div>
          )}

          {/* Cupid 2 Targets Prompt */}
          {me.role === 'CUPID' && !actionConfirmed && (
            <div className="mt-2 text-xs text-pink-300 font-medium flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
              <span>
                Chạm vào 2 thẻ bài để kết duyên: {selectedTargetId ? 'Đã chọn người 1' : 'Chưa chọn'}
                {secondTargetId ? ' & Đã chọn người 2' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. SLEEPING / WAITING BANNER (When it is NOT current player's turn) */}
      {!canAct && (
        <div className="rounded-2xl bg-gradient-to-b from-[#131422] to-[#0c0d16] border border-gray-800/80 p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <Moon className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-sm font-black text-gray-200 flex items-center justify-center gap-1.5">
            <span>🌙 Làng Đang Chìm Trong Giấc Ngủ...</span>
          </h3>

          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
            {activeStep ? (
              <span>
                Đang đến lượt <strong className="text-amber-300">{activeStep.nameVi}</strong> thức giấc thi triển kỹ năng (còn {roomState.timer}s). Hãy giữ im lặng để không đánh thức kẻ thù!
              </span>
            ) : (
              <span>Đêm đen bao trùm ngôi làng... Các nhân vật bí mật đang lần lượt hành động.</span>
            )}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900/90 border border-gray-800 text-[11px] font-semibold text-gray-400">
            <Lock className="w-3.5 h-3.5 text-gray-500" />
            <span>Thẻ bài đang bị khóa trong lượt của người khác</span>
          </div>
        </div>
      )}

      {/* 4. 2-COLUMN CARD GRID (Selectable ONLY when canAct === true) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {roomState.players.map((player) => {
          const isSelected = selectedTargetId === player.id;
          const isSecond = secondTargetId === player.id;
          const isMe = player.id === me.id;

          // Werewolves see victim candidate
          const isWolfTarget =
            canAct &&
            me.role === 'WEREWOLF' &&
            roomState.nightVictims?.wolfVictimId === player.id;

          // Selection badges
          let badge: string | undefined = undefined;
          if (isSelected && me.role === 'CUPID') badge = 'Người Yêu 1';
          if (isSecond && me.role === 'CUPID') badge = 'Người Yêu 2';
          if (isSelected && me.role === 'SEER') badge = 'Soi Thân Phận';
          if (isSelected && me.role === 'BODYGUARD') badge = 'Bảo Vệ';
          if (isSelected && me.role === 'WEREWOLF') badge = 'Cắn Xé';
          if (isSelected && me.role === 'HUNTER') badge = 'Mục Tiêu Ngắm';
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
                (canAct && me.role === 'WEREWOLF' && player.role === 'WEREWOLF') ||
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
