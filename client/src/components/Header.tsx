import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Eye,
  Moon,
  Sun,
  Vote,
  Trophy,
  Users,
  Timer as TimerIcon,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { copyToClipboard } from '../utils/helpers';
import { ROLE_DEFINITIONS } from '@werewolf/shared';

export const Header: React.FC = () => {
  const { roomState, me, isMuted, toggleMute, setIsRoleDrawerOpen } = useGame();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!roomState) return null;

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomState.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getPhaseInfo = () => {
    switch (roomState.phase) {
      case 'NIGHT':
        return {
          title: `Đêm ${roomState.dayNumber}`,
          icon: <Moon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />,
          color: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300',
        };
      case 'DAY_DISCUSSION':
        return {
          title: `Ngày ${roomState.dayNumber}: Thảo luận`,
          icon: <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />,
          color: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
        };
      case 'DAY_VOTING':
        return {
          title: `Ngày ${roomState.dayNumber}: Bỏ phiếu`,
          icon: <Vote className="w-3.5 h-3.5 text-red-400 animate-bounce" />,
          color: 'bg-red-950/80 border-red-500/40 text-red-300',
        };
      case 'GAME_OVER':
        return {
          title: 'Kết Thúc',
          icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" />,
          color: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-300',
        };
      default:
        return {
          title: 'Phòng Chờ',
          icon: <Users className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const isUrgent = roomState.timer <= 5 && roomState.timer > 0 && roomState.phase !== 'LOBBY' && roomState.phase !== 'GAME_OVER';

  return (
    <header className="sticky top-0 z-30 w-full bg-[#11121d]/90 backdrop-blur-md border-b border-gray-800/80 px-2.5 py-1.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5">
        
        {/* TOP-LEFT COMPACT COUNTDOWN TIMER - chỉ chạy số ở góc trái, không che nhân vật */}
        <div className="flex items-center gap-1.5">
          {roomState.phase !== 'LOBBY' && roomState.phase !== 'GAME_OVER' ? (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider transition-colors shadow-sm ${
                isUrgent
                  ? 'bg-red-600/90 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-gray-800/90 text-amber-400 border border-amber-500/30'
              }`}
              title="Thời gian còn lại"
            >
              <TimerIcon className={`w-3.5 h-3.5 ${isUrgent ? 'animate-spin' : ''}`} />
              <span className="text-sm font-mono font-extrabold">{roomState.timer}s</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-800/80 text-gray-300 border border-gray-700/50">
              <span className="text-xs">Ma Sói</span>
            </div>
          )}

          {/* Phase Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${phaseInfo.color}`}
          >
            {phaseInfo.icon}
            <span className="truncate max-w-[110px] sm:max-w-none">{phaseInfo.title}</span>
          </div>
        </div>

        {/* CENTER / ROOM CODE with 1-tap copy */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800/90 hover:bg-gray-700 active:scale-95 border border-gray-700 text-xs font-semibold text-gray-200 transition-all shadow-sm"
          title="Bấm để sao chép mã phòng"
        >
          <span className="text-gray-400 font-normal hidden xs:inline">Mã:</span>
          <span className="font-mono text-emerald-400 font-bold tracking-wider">{roomState.code}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* RIGHT CONTROLS: Role Peek Drawer, Fullscreen, Mute */}
        <div className="flex items-center gap-1">
          {/* Secret Role Peek Button */}
          {me?.role && (
            <button
              onClick={() => setIsRoleDrawerOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800/80 active:scale-95 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all shadow-sm"
              title="Xem lá bài bí mật của bạn"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Thẻ bài:</span>
              <span className="font-bold text-amber-300">{ROLE_DEFINITIONS[me.role]?.nameVi.split(' ')[0]}</span>
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-gray-700 text-gray-300 transition-all"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 active:scale-95 border border-gray-700 text-gray-300 transition-all"
            title={isFullscreen ? 'Thu nhỏ màn hình' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
