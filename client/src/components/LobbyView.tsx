import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import {
  DEFAULT_AVATARS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  RECOMMENDED_ROLE_CONFIGS,
  ROLE_DEFINITIONS,
} from '@werewolf/shared';
import {
  Users,
  Play,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Shuffle,
  Shield,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';

export const LobbyView: React.FC = () => {
  const { roomState, me, joinRoom, leaveRoom, startGame, error, clearError } = useGame();

  const [inputName, setInputName] = useState(
    () => localStorage.getItem('werewolf_name') || `NgườiChơi_${Math.floor(100 + Math.random() * 900)}`
  );
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [copied, setCopied] = useState(false);

  // If in room
  if (roomState) {
    const isHost = me?.isHost;
    const playerCount = roomState.players.length;
    const canStart = playerCount >= MIN_PLAYERS;
    const recommendedRoles = RECOMMENDED_ROLE_CONFIGS[playerCount] || [];

    const handleCopy = async () => {
      const ok = await copyToClipboard(roomState.code);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-3 py-4 flex flex-col gap-4 pb-20">
        {/* Lobby Header Card */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-4 sm:p-6 border border-indigo-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Phòng Chờ Sẵn Sàng
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {playerCount}/{MAX_PLAYERS} người chơi
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Phòng: <span className="font-mono text-amber-400">{roomState.code}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Chia sẻ mã phòng này cho bạn bè để cùng tham gia!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-200 border border-gray-700 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã chép mã!' : 'Sao chép mã'}</span>
            </button>

            <button
              onClick={leaveRoom}
              className="p-2 rounded-xl text-xs font-bold bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/30 transition-all active:scale-95"
              title="Rời phòng"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recommended Role Lineup for Current Player Count */}
        {recommendedRoles.length > 0 && (
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800/80 p-3 sm:p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Thiết lập nhân vật dự kiến ({recommendedRoles.length} vai trò):</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {recommendedRoles.map((role, idx) => {
                const def = ROLE_DEFINITIONS[role];
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-gray-800/90 text-gray-200 border border-gray-700/60 shadow-sm"
                  >
                    <span>{def.icon}</span>
                    <span>{def.nameVi.split(' ')[0]}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-COLUMN / RESPONSIVE CARD GRID OF PLAYERS IN LOBBY */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Danh sách người chơi ({playerCount})</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {roomState.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isMe={player.id === me?.id}
                showRole={false}
              />
            ))}
          </div>
        </div>

        {/* Host Game Start Section */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#141525] to-[#10111d] border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-gray-300">
              {isHost ? 'Bạn là Chủ Phòng' : `Chủ phòng: ${roomState.players.find((p) => p.isHost)?.name || '...'}`}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {canStart
                ? 'Đã đủ số người tối thiểu để bắt đầu!'
                : `Cần tối thiểu ${MIN_PLAYERS} người chơi để bắt đầu ván (còn thiếu ${MIN_PLAYERS - playerCount} người).`}
            </p>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-gray-950" />
              <span>Bắt Đầu Ván Đấu</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-amber-400/90 animate-pulse">
              Đang chờ chủ phòng bắt đầu...
            </span>
          )}
        </div>
      </div>
    );
  }

  // Not in room: Room Join / Create Screen
  const handleRandomRoom = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setInputRoomCode(code);
  };

  const handleJoinOrCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;

    localStorage.setItem('werewolf_name', name);
    const code = inputRoomCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();

    joinRoom(code, name, selectedAvatar);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#121320] border border-gray-800 shadow-2xl p-5 sm:p-6 flex flex-col gap-5">
        
        {/* Brand / Logo */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-red-600 to-purple-800 shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-3">
            <Moon className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Ma Sói <span className="text-amber-400">Online</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Game Thẻ Bài Ma Sói Trực Tuyến - Mobile-First
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleJoinOrCreate} className="flex flex-col gap-4">
          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              Tên nhân vật của bạn
            </label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Nhập tên hiển thị..."
              maxLength={20}
              required
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Chọn Chibi Avatar của bạn
            </label>
            <div className="grid grid-cols-6 gap-2">
              {DEFAULT_AVATARS.map((avatar, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative p-1 rounded-xl border transition-all ${
                    selectedAvatar === avatar
                      ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/20 scale-105'
                      : 'border-gray-800 bg-gray-900/60 hover:border-gray-600'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-auto rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Room Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-300">
                Mã phòng
              </label>
              <button
                type="button"
                onClick={handleRandomRoom}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <Shuffle className="w-3 h-3" />
                <span>Tạo ngẫu nhiên</span>
              </button>
            </div>
            <input
              type="text"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              placeholder="Để trống để tạo phòng mới..."
              maxLength={8}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-wider text-amber-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold uppercase"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{inputRoomCode.trim() ? 'Tham Gia Phòng' : 'Tạo & Vào Phòng'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-500">
          Thiết kế Mobile-First dạng thẻ bài tối ưu cho điện thoại và máy tính.
        </p>
      </div>
    </div>
  );
};
