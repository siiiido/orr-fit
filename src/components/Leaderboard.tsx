import React, { useState } from 'react';
import { Search, Trophy, Medal, Star } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onSelectMember: (memberId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onSelectMember }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const search = searchQuery.trim().toLowerCase();
    const matchName = entry.name.toLowerCase().includes(search);
    const matchNick = entry.nickname?.toLowerCase().includes(search) || false;
    return matchName || matchNick;
  });

  const topThree = entries.slice(0, 3);
  const podiumArrangement = [
    topThree[1] || null, // 2nd
    topThree[0] || null, // 1st
    topThree[2] || null, // 3rd
  ];

  const getTierMedalEmoji = (tier?: string) => {
    if (tier === 'gold') return '🥇';
    if (tier === 'silver') return '🥈';
    if (tier === 'bronze') return '🥉';
    return null;
  };

  const renderNameTag = (entry: LeaderboardEntry) => {
    return (
      <span className="flex items-center gap-1">
        {entry.nickname ? (
          <>
            <span className="text-brand-orange font-black">{entry.nickname}</span>
            <span className="text-[10px] text-gray-500 font-normal">({entry.name})</span>
          </>
        ) : (
          <span className="font-bold text-white">{entry.name}</span>
        )}
        {getTierMedalEmoji(entry.highestChallengeTier)}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Podium for top 3 */}
      <div className="bg-brand-darkSurface border border-brand-orange/5 p-6 rounded-2xl">
        <h3 className="text-lg font-black text-white text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-brand-gold" />
          Hall of Fame
        </h3>

        <div className="flex items-end justify-center gap-2 md:gap-4 pt-12 pb-2">
          {podiumArrangement.map((entry, index) => {
            if (!entry) return <div key={index} className="flex-1"></div>;

            const isFirst = entry.memberId === topThree[0]?.memberId;
            const isThird = entry.memberId === topThree[2]?.memberId;

            let podiumHeight = 'h-24';
            let badgeColor = 'bg-brand-silver';
            let textColor = 'text-brand-silver';
            let rankName = '2nd';
            let crownIcon = null;

            if (isFirst) {
              podiumHeight = 'h-36';
              badgeColor = 'bg-brand-gold';
              textColor = 'text-brand-gold';
              rankName = '1st';
              crownIcon = <Star className="w-5 h-5 text-brand-gold fill-brand-gold absolute -top-11 animate-pulse" />;
            } else if (isThird) {
              podiumHeight = 'h-20';
              badgeColor = 'bg-brand-bronze';
              textColor = 'text-brand-bronze';
              rankName = '3rd';
            }

            return (
              <div key={entry.memberId} className="flex flex-col items-center flex-1 relative group">
                {crownIcon}

                {/* Nickname & Name block clickable */}
                <button
                  onClick={() => onSelectMember(entry.memberId)}
                  className="text-sm font-black text-white text-center max-w-[120px] truncate mb-2 block hover:underline cursor-pointer"
                >
                  {entry.nickname ? (
                    <>
                      <span className="text-brand-orange font-black block">{entry.nickname}</span>
                      <span className="text-[10px] text-gray-500 font-normal">({entry.name})</span>
                    </>
                  ) : (
                    entry.name
                  )}
                </button>

                <span className={`text-xs font-black ${textColor} mb-2 block`}>
                  {entry.totalDistance.toFixed(1)} km
                </span>

                <div
                  className={`w-full rounded-t-xl flex flex-col justify-center items-center shadow-lg border-t transition-all duration-500 ${podiumHeight} ${
                    isFirst
                      ? 'bg-brand-orange/20 border-brand-orange/40 shadow-orangeGlow'
                      : 'bg-brand-darkBg border-gray-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${badgeColor} flex items-center justify-center text-brand-darkBg font-black text-sm`}>
                    {rankName.substring(0, 1)}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold mt-1 font-mono">{entry.averagePace}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard list & search */}
      <div className="bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-base font-bold text-white">회원 순위 현황</h3>

          <div className="relative w-full md:w-48">
            <input
              type="text"
              placeholder="회원 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2 pl-9 text-xs focus:outline-none focus:border-brand-orange text-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-gray-400">
            <thead>
              <tr className="border-b border-gray-800 pb-2">
                <th className="pb-2 text-center w-12">순위</th>
                <th className="pb-2">이름 (닉네임)</th>
                <th className="pb-2 text-right">기록 수</th>
                <th className="pb-2 text-right">평균 페이스</th>
                <th className="pb-2 text-right text-white">누적 거리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {filteredEntries.map((entry) => {
                const rank = entries.findIndex((e) => e.memberId === entry.memberId) + 1;
                const isTop3 = rank <= 3;

                let medalColor = '';
                if (rank === 1) medalColor = 'text-brand-gold';
                if (rank === 2) medalColor = 'text-brand-silver';
                if (rank === 3) medalColor = 'text-brand-bronze';

                return (
                  <tr key={entry.memberId} className="hover:bg-brand-darkBg/30 transition-colors">
                    <td className="py-3 text-center">
                      {isTop3 ? (
                        <Medal className={`w-5 h-5 mx-auto ${medalColor}`} />
                      ) : (
                        <span className="font-bold text-gray-500">{rank}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => onSelectMember(entry.memberId)}
                        className="flex items-center gap-1.5 hover:underline text-left cursor-pointer font-bold text-white"
                      >
                        {renderNameTag(entry)}
                        <span className={`text-[9px] px-1 rounded-md font-extrabold ${entry.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                          {entry.gender}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 text-right">{entry.totalRuns}회</td>
                    <td className="py-3 text-right text-gray-500 font-mono">{entry.averagePace}</td>
                    <td className="py-3 text-right text-brand-orange font-black text-sm">{entry.totalDistance.toFixed(1)} km</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
