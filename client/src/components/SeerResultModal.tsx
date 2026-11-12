import React from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_DEFINITIONS } from '@werewolf/shared';
import { Eye, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SeerResultModal: React.FC = () => {
  const { seerResult, setSeerResult } = useGame();

  if (!seerResult) return null;

  const roleDef = ROLE_DEFINITIONS[seerResult.role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#131424] border-2 border-emerald-500/60 shadow-2xl p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
          <Eye className="w-6 h-6 animate-pulse" />
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          Quả Cầu Pha Lê Tiên Tri
        </h3>
        <h4 className="text-base font-extrabold text-white mt-1">
          Kết Quả Soi Thân Phận
        </h4>

        {/* Revealed Target Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-[#1c1d33] to-[#121322] border border-gray-700/80 shadow-inner">
          <p className="text-sm font-bold text-gray-300">
            Mục tiêu: <span className="text-white font-extrabold">{seerResult.targetName}</span>
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-3xl">{roleDef?.icon || '❓'}</span>
            <span className="text-lg font-black text-amber-300">
              {roleDef?.nameVi || seerResult.role}
            </span>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-md">
            {seerResult.isEvil ? (
              <span className="bg-red-950 text-red-400 border border-red-500/50 px-3 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Kẻ Gian Ác (Phe Ma Sói)
              </span>
            ) : (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lương Dân (Phe Làng)
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Hãy giữ bí mật hoặc khéo léo dẫn dắt dân làng vào ban ngày!
        </p>

        <button
          onClick={() => setSeerResult(null)}
          className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1"
        >
          <Check className="w-4 h-4" />
          <span>Đã Nhìn Thấu</span>
        </button>
      </div>
    </div>
  );
};
