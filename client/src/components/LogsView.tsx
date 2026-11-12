import React from 'react';
import { useGame } from '../context/GameContext';
import { ScrollText, Skull, Vote, Sun, Moon, Sparkles } from 'lucide-react';

export const LogsView: React.FC = () => {
  const { roomState } = useGame();

  if (!roomState) return null;

  const logs = roomState.logs || [];

  return (
    <div className="flex flex-col bg-[#11121d] rounded-2xl border border-gray-800/80 shadow-2xl p-4 h-[calc(100vh-140px)] sm:h-[600px] overflow-hidden">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
        <ScrollText className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-extrabold text-white">Nhật Ký Làng</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <ScrollText className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-xs">Chưa có sự kiện nào được ghi nhận.</p>
          </div>
        ) : (
          logs.map((log) => {
            const getIcon = () => {
              switch (log.type) {
                case 'DEATH':
                  return <Skull className="w-4 h-4 text-red-400 shrink-0" />;
                case 'VOTE':
                  return <Vote className="w-4 h-4 text-amber-400 shrink-0" />;
                case 'NIGHT_RESULT':
                  return <Moon className="w-4 h-4 text-indigo-400 shrink-0" />;
                case 'WIN':
                  return <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />;
                default:
                  return <Sun className="w-4 h-4 text-blue-400 shrink-0" />;
              }
            };

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800/60 text-xs"
              >
                {getIcon()}
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                    <span className="font-bold text-gray-300">Ngày {log.day}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{log.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
