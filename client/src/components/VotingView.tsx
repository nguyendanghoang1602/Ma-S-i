import React from 'react';
import { useGame } from '../context/GameContext';
import { PlayerCard } from './PlayerCard';
import { Player } from '@werewolf/shared';
import { Vote, Ban, CheckCircle2 } from 'lucide-react';

export const VotingView: React.FC = () => {
  const { roomState, me, castVote } = useGame();

  if (!roomState || !me) return null;

  // roomState.votes is a record of { voterId: targetId }
  const myVote = roomState.votes ? roomState.votes[me.id] : null;

  // Calculate vote counts and voter lists for each living player
  const voteTallies: Record<string, { count: number; voterNames: string[] }> = {};
  let abstainCount = 0;

  if (roomState.votes) {
    Object.entries(roomState.votes).forEach(([voterId, targetId]) => {
      const voter = roomState.players.find((p) => p.id === voterId);
      if (!voter) return;

      const weight = voter.isMayor ? 2 : 1;

      if (!targetId) {
        abstainCount += weight;
      } else {
        if (!voteTallies[targetId]) {
          voteTallies[targetId] = { count: 0, voterNames: [] };
        }
        voteTallies[targetId].count += weight;
        voteTallies[targetId].voterNames.push(voter.name + (voter.isMayor ? ' (x2)' : ''));
      }
    });
  }

  const handleVotePlayer = (player: Player) => {
    if (!me.isAlive) return;
    if (!player.isAlive) return;

    // Toggle vote or vote new target
    if (myVote === player.id) {
      castVote(null); // unvote / abstain
    } else {
      castVote(player.id);
    }
  };

  const handleAbstain = () => {
    if (!me.isAlive) return;
    castVote(null);
  };

  const votedTargetPlayer = myVote
    ? roomState.players.find((p) => p.id === myVote)
    : null;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Voting Phase Top Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 p-3 sm:p-4 border border-red-900/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-900/80 border border-red-500/40 text-red-300">
              <Vote className="w-5 h-5 text-red-400 animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Bỏ Phiếu Treo Cổ (Ngày {roomState.dayNumber})</span>
              </h2>
              <p className="text-xs text-red-200/90 mt-0.5">
                {me.isAlive
                  ? 'Chạm vào 1 thẻ bài để bỏ phiếu xử tử kẻ bạn nghi ngờ là Ma Sói.'
                  : 'Bạn đã chết, không thể tham gia bỏ phiếu.'}
              </p>
            </div>
          </div>

          {/* Quick status of current player's vote */}
          {me.isAlive && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAbstain}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1 ${
                  myVote === null
                    ? 'bg-gray-800 text-amber-300 border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-gray-900/80 text-gray-400 border-gray-700 hover:text-white'
                }`}
                title="Không bỏ phiếu cho ai"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Bỏ phiếu trắng {abstainCount > 0 ? `(${abstainCount})` : ''}</span>
              </button>
            </div>
          )}
        </div>

        {/* Current Vote Confirmation Alert */}
        {me.isAlive && votedTargetPlayer && (
          <div className="mt-2.5 pt-2 border-t border-red-900/40 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bạn đang bỏ phiếu cho:</span>
            <span className="font-extrabold text-white bg-red-900/60 px-2 py-0.5 rounded-md border border-red-500/30">
              {votedTargetPlayer.name}
            </span>
            <span className="text-gray-400 text-[11px]">(Chạm lại vào thẻ bài để hủy)</span>
          </div>
        )}
      </div>

      {/* 2-COLUMN CARD GRID OPTIMIZED FOR MOBILE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {roomState.players.map((player) => {
          const isSelected = myVote === player.id;
          const isMe = player.id === me.id;
          const tally = voteTallies[player.id] || { count: 0, voterNames: [] };

          return (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={isMe}
              isSelected={isSelected}
              isSelectable={me.isAlive && player.isAlive}
              voteCount={tally.count}
              voterNames={tally.voterNames}
              selectionBadge={isSelected ? 'Phiếu của bạn' : undefined}
              showRole={roomState.phase === 'GAME_OVER'}
              onClick={() => handleVotePlayer(player)}
            />
          );
        })}
      </div>
    </div>
  );
};
