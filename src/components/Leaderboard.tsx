import React, { useState } from 'react';
import { Search, Trophy, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onSelectMember: (memberId: string) => void;
  onOpenStamps: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onSelectMember, onOpenStamps }) => {
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
      <span className="flex flex-wrap items-center gap-1">
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

  // 순위별 칭호·스타일 설정
  const getRankConfig = (isFirst: boolean, isSecond: boolean) => {
    if (isFirst) return {
      title: '레이스킹',
      emoji: '👑',
      podiumH: 'h-40',
      badgeBg: 'bg-brand-gold',
      podiumBg: 'bg-brand-orange/15 border-brand-orange/50',
      glow: '0 0 20px rgba(255,106,0,0.35)',
      rankNum: '1',
      nameColor: 'text-brand-orange',
      distColor: 'text-brand-gold',
      titleColor: 'text-yellow-300',
    };
    if (isSecond) return {
      title: '러너즈하이',
      emoji: '⚡',
      podiumH: 'h-32',
      badgeBg: 'bg-brand-silver',
      podiumBg: 'bg-brand-darkBg border-gray-600',
      glow: 'none',
      rankNum: '2',
      nameColor: 'text-white',
      distColor: 'text-slate-300',
      titleColor: 'text-slate-400',
    };
    return {
      title: '페이스메이커',
      emoji: '🔥',
      podiumH: 'h-28',
      badgeBg: 'bg-brand-bronze',
      podiumBg: 'bg-brand-darkBg border-gray-700',
      glow: 'none',
      rankNum: '3',
      nameColor: 'text-white',
      distColor: 'text-amber-400',
      titleColor: 'text-amber-500',
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Podium for top 3 */}
      <div className="bg-brand-darkSurface border border-brand-orange/5 p-5 rounded-2xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-5 border-b border-gray-900 pb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Trophy className="w-4 h-4 text-brand-gold" />
              <span className="text-[10px] font-black text-brand-gold tracking-widest uppercase">Hall of Fame</span>
            </div>
            <h3 className="text-lg font-black text-white leading-none">
              이달의 <span className="text-brand-orange">Top 3</span>
            </h3>
            <p className="text-[10px] text-gray-600 font-semibold mt-0.5">누적 거리 기준 월간 상위 랭커</p>
          </div>
          <button
            onClick={onOpenStamps}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-brand-orange to-yellow-600 hover:from-brand-orange/90 hover:to-yellow-700 text-white font-extrabold text-xs rounded-xl shadow-orangeGlow transition-all duration-300 animate-pulse flex items-center justify-center gap-1.5"
          >
            🏆 명예의 전당 도장판 보기
          </button>
        </div>

        {/* ── Podium ── */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 items-end max-w-lg mx-auto pb-2" style={{ paddingTop: '8px' }}>
          {podiumArrangement.map((entry, index) => {
            if (!entry) return <div key={index} />;

            const isFirst = entry.memberId === topThree[0]?.memberId;
            const isSecond = entry.memberId === topThree[1]?.memberId;
            const rankConfig = getRankConfig(isFirst, isSecond);
            const medalEmoji = getTierMedalEmoji(entry.highestChallengeTier);

            return (
              <div key={entry.memberId} className="flex flex-col items-center min-w-0">

                {/* ── 이름 ── */}
                <button
                  onClick={() => onSelectMember(entry.memberId)}
                  className="w-full text-center mb-1 hover:opacity-75 transition-opacity cursor-pointer flex flex-col items-center min-w-0 px-1"
                >
                  {entry.nickname ? (
                    <div className="w-full min-w-0">
                      <span className={`text-sm font-black block truncate ${rankConfig.nameColor}`}>
                        {entry.nickname} {medalEmoji}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold block truncate">
                        ({entry.name})
                      </span>
                    </div>
                  ) : (
                    <span className={`text-sm font-black block truncate ${rankConfig.nameColor}`}>
                      {entry.name} {medalEmoji}
                    </span>
                  )}
                </button>

                {/* ── 거리 ── */}
                <span className={`text-sm font-black ${rankConfig.distColor} mb-2 block tracking-tight`}>
                  {entry.totalDistance.toFixed(1)}<span className="text-xs font-bold"> km</span>
                </span>

                {/* ── 포디움 기둥 (순위 번호 + 칭호) ── */}
                <div
                  className={`w-full rounded-t-xl flex flex-col items-center justify-center gap-2 border-t ${rankConfig.podiumH} ${rankConfig.podiumBg}`}
                  style={{ boxShadow: rankConfig.glow }}
                >
                  <div className={`w-10 h-10 rounded-full ${rankConfig.badgeBg} flex items-center justify-center text-brand-darkBg font-black text-lg`}>
                    {rankConfig.rankNum}
                  </div>
                  <div className="text-center px-1">
                    <div className="text-xl leading-none mb-0.5">{rankConfig.emoji}</div>
                    <p className={`text-[10px] font-black ${rankConfig.titleColor} whitespace-nowrap leading-tight`}>
                      {rankConfig.title}
                    </p>
                  </div>
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
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2 pl-9 text-base sm:text-xs focus:outline-none focus:border-brand-orange text-white"
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
                <th className="pb-2 text-right hidden sm:table-cell">기록 수</th>
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
                  <tr
                    key={entry.memberId}
                    onClick={() => onSelectMember(entry.memberId)}
                    className="hover:bg-brand-darkBg/30 transition-colors cursor-pointer group/row"
                  >
                    <td className="py-3 text-center">
                      {isTop3 ? (
                        <Medal className={`w-5 h-5 mx-auto ${medalColor}`} />
                      ) : (
                        <span className="font-bold text-gray-500">{rank}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-left font-bold text-white group-hover/row:underline">
                        {renderNameTag(entry)}
                        <span className={`text-[9px] px-1 rounded-md font-extrabold ${entry.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                          {entry.gender}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell">{entry.totalRuns}회</td>
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
