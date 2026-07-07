import React, { useState } from 'react';
import { X, Search, Trophy, Check } from 'lucide-react';
import type { Member, MonthlyRanking } from '../types';

interface StampsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  monthlyRankings: MonthlyRanking[];
}

export const StampsModal: React.FC<StampsModalProps> = ({
  isOpen,
  onClose,
  members,
  monthlyRankings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // 멤버별 도장 획득 이력 매핑
  const memberStampsMap = members.map(m => {
    // 해당 멤버의 모든 랭킹 데이터 필터링 (오래된 날짜순)
    const records = monthlyRankings
      .filter(r => r.member_id === m.id)
      .sort((a, b) => a.year_month.localeCompare(b.year_month));

    const totalStamps = Math.min(records.length, 6); // 최대 6개 도장 표시

    return {
      member: m,
      records,
      totalStamps,
      isAllCleared: totalStamps >= 6,
    };
  });

  // 이름 및 닉네임 검색 필터
  const search = searchQuery.trim().toLowerCase();
  const filteredMembers = memberStampsMap.filter(item => {
    const matchName = item.member.name.toLowerCase().includes(search);
    const matchNick = item.member.nickname?.toLowerCase().includes(search) || false;
    return matchName || matchNick;
  });

  // 정렬: 도장 개수 내림차순 -> 이름 오름차순
  const sortedMembers = filteredMembers.sort((a, b) => {
    if (b.totalStamps !== a.totalStamps) {
      return b.totalStamps - a.totalStamps;
    }
    return a.member.name.localeCompare(b.member.name);
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-brand-darkSurface border border-brand-orange/20 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-brand-gold animate-bounce" />
            <div>
              <h2 className="text-lg font-black text-white">명예의 전당 도장 현황</h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                매월 1~6위 달성 시 도장이 찍힙니다! 6개를 다 모으면 선물을 드려요 🎁
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white bg-brand-darkBg hover:bg-gray-800 rounded-xl transition-all"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-900 bg-brand-darkBg/30">
          <div className="relative">
            <input
              type="text"
              placeholder="회원 검색 (이름 또는 닉네임)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-darkBg border border-gray-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-brand-orange"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Member Stamps Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sortedMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12 font-bold">검색 결과가 없습니다.</p>
          ) : (
            sortedMembers.map(({ member, records, totalStamps, isAllCleared }) => (
              <div
                key={member.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isAllCleared
                    ? 'bg-brand-gold/5 border-brand-gold shadow-goldGlow'
                    : 'bg-brand-darkBg border-gray-800/80 hover:border-gray-700'
                }`}
              >
                {/* Member Info */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    {member.nickname ? (
                      <div>
                        <span className="text-sm font-black text-brand-orange">{member.nickname}</span>
                        <span className="text-[10px] text-gray-500 font-bold ml-1">({member.name})</span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-white">{member.name}</span>
                    )}
                    <span className={`text-[9px] px-1 rounded font-extrabold ${
                      member.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
                    }`}>
                      {member.gender}
                    </span>
                    {isAllCleared && (
                      <span className="text-[10px] bg-brand-gold text-brand-darkBg px-2 py-0.5 rounded-full font-black animate-pulse">
                        🎉 상품 완료!
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-black text-gray-400">
                    도장 {totalStamps} / 6
                  </span>
                </div>

                {/* Stamp Board (6 slots) */}
                <div className="grid grid-cols-6 gap-2 max-w-sm mb-3">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const record = records[idx]; // 날짜 오름차순
                    const isActive = !!record;

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-full flex flex-col items-center justify-center border text-[9px] font-black relative ${
                          isActive
                            ? 'bg-brand-orange text-white border-brand-orange shadow-orangeGlow'
                            : 'border-dashed border-gray-800 text-gray-600 bg-brand-darkSurface/50'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 mb-0.5 text-white stroke-[3px]" />
                            <span className="leading-none text-[8px] font-bold">
                              {record.year_month.substring(5, 7)}월
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stamp Records Detail (Always visible text for mobile readability) */}
                {records.length > 0 ? (
                  <div className="text-[10px] text-gray-500 font-bold leading-relaxed border-t border-gray-800/40 pt-2">
                    달성 이력:{' '}
                    {records.slice(0, 6).map((r, i, arr) => (
                      <span key={r.id}>
                        {r.year_month.substring(5, 7)}월 {r.rank}등({r.distance.toFixed(1)}km)
                        {i < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-600 font-bold">도장 획득 내역이 아직 없습니다.</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
