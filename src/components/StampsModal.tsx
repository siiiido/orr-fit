import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { X, Search, Zap } from 'lucide-react';
import type { Member, MonthlyRanking } from '../types';

interface StampsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  monthlyRankings: MonthlyRanking[];
}

// 티어 정보
const TIERS = [
  { min: 0, max: 0, label: 'ROOKIE', color: '#6b7280', bg: 'from-gray-700 to-gray-800', glow: 'shadow-gray-700/50', textColor: 'text-gray-400' },
  { min: 1, max: 2, label: 'BRONZE', color: '#cd7f32', bg: 'from-amber-800 to-orange-900', glow: 'shadow-amber-700/60', textColor: 'text-amber-500' },
  { min: 3, max: 4, label: 'SILVER', color: '#a8a9ad', bg: 'from-slate-500 to-slate-700', glow: 'shadow-slate-400/60', textColor: 'text-slate-300' },
  { min: 5, max: 5, label: 'GOLD', color: '#ffd700', bg: 'from-yellow-500 to-amber-600', glow: 'shadow-yellow-400/70', textColor: 'text-yellow-300' },
  { min: 6, max: 6, label: 'LEGEND', color: '#ff6a00', bg: 'from-orange-500 via-pink-500 to-purple-600', glow: 'shadow-orange-400/80', textColor: 'text-orange-300' },
];

const getTier = (stamps: number) => {
  return TIERS.slice().reverse().find(t => stamps >= t.min) || TIERS[0];
};

// 보석 SVG 컴포넌트
const GemIcon: React.FC<{ active: boolean; index: number; monthLabel?: string }> = ({ active, index, monthLabel }) => {
  const gemColors = [
    { fill: '#ff6a00', glow: '#ff6a00' },   // 1
    { fill: '#a855f7', glow: '#a855f7' },   // 2
    { fill: '#3b82f6', glow: '#3b82f6' },   // 3
    { fill: '#10b981', glow: '#10b981' },   // 4
    { fill: '#f59e0b', glow: '#f59e0b' },   // 5
    { fill: '#ec4899', glow: '#ec4899' },   // 6
  ];
  const color = gemColors[index] || gemColors[0];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-9 h-9 flex items-center justify-center">
        {active ? (
          <>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-40 blur-md animate-pulse"
              style={{ backgroundColor: color.glow }}
            />
            <svg viewBox="0 0 40 44" className="w-8 h-8 relative z-10 drop-shadow-lg">
              <defs>
                <linearGradient id={`gem-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="40%" stopColor={color.fill} stopOpacity="1" />
                  <stop offset="100%" stopColor={color.fill} stopOpacity="0.7" />
                </linearGradient>
              </defs>
              {/* Gem shape */}
              <polygon
                points="20,2 38,14 38,30 20,42 2,30 2,14"
                fill={`url(#gem-grad-${index})`}
                stroke={color.fill}
                strokeWidth="1"
              />
              {/* Shine */}
              <polygon points="20,4 30,10 24,10 16,4" fill="white" opacity="0.4" />
            </svg>
          </>
        ) : (
          <svg viewBox="0 0 40 44" className="w-8 h-8 relative z-10 opacity-20">
            <polygon
              points="20,2 38,14 38,30 20,42 2,30 2,14"
              fill="none"
              stroke="#374151"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text x="20" y="26" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">{index + 1}</text>
          </svg>
        )}
      </div>
      {active && monthLabel && (
        <span className="text-[8px] font-black text-gray-400 leading-none">{monthLabel}</span>
      )}
      {!active && (
        <span className="text-[8px] font-bold text-gray-700 leading-none">?</span>
      )}
    </div>
  );
};

// 파티클 컴포넌트 (Legend 전용)
const LegendParticles: React.FC = () => {
  const particles = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: ['#ff6a00', '#ffd700', '#ec4899', '#a855f7'][i % 4],
            left: `${10 + i * 11}%`,
            top: '100%',
          }}
          animate={{
            y: [0, -80 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export const StampsModal: React.FC<StampsModalProps> = ({
  isOpen,
  onClose,
  members,
  monthlyRankings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 멤버별 도장 획득 이력 매핑
  const memberStampsMap = members.map(m => {
    const records = monthlyRankings
      .filter(r => r.member_id === m.id)
      .sort((a, b) => a.year_month.localeCompare(b.year_month));
    const totalStamps = Math.min(records.length, 6);
    return { member: m, records, totalStamps, isAllCleared: totalStamps >= 6 };
  });

  const search = searchQuery.trim().toLowerCase();
  const filteredMembers = memberStampsMap.filter(item => {
    const matchName = item.member.name.toLowerCase().includes(search);
    const matchNick = item.member.nickname?.toLowerCase().includes(search) || false;
    return matchName || matchNick;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (b.totalStamps !== a.totalStamps) return b.totalStamps - a.totalStamps;
    return a.member.name.localeCompare(b.member.name);
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {isLoading ? (
        <div onClick={(e) => e.stopPropagation()}>
          <DotLottieReact src="/run.lottie" loop autoplay style={{ width: 200, height: 200 }} />
        </div>
      ) : (
        <motion.div
          className="w-full max-w-lg flex flex-col max-h-[92vh] rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            background: 'linear-gradient(160deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)',
            border: '1px solid rgba(255,106,0,0.3)',
            boxShadow: '0 0 40px rgba(255,106,0,0.15), 0 0 80px rgba(168,85,247,0.1)',
          }}
        >
          {/* ── HEADER ── */}
          <div className="relative px-4 pt-5 pb-0 flex-shrink-0">
            {/* Animated top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden">
              <motion.div
                className="h-full w-1/2"
                style={{ background: 'linear-gradient(90deg, transparent, #ff6a00, #ffd700, #ec4899, transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Title row */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white leading-none">명예의 전당</h2>
                    <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20">HALL OF FAME</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">보석을 모아 레전드가 되어보세요!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-white/10"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── NOTICE BOARD ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-xl overflow-hidden mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,106,0,0.08) 0%, rgba(168,85,247,0.08) 100%)',
                border: '1px solid rgba(255,106,0,0.25)',
              }}
            >
              {/* Notice board header strip */}
              <div
                className="px-3 py-1.5 flex items-center gap-2"
                style={{ background: 'linear-gradient(90deg, rgba(255,106,0,0.3), rgba(168,85,247,0.2))' }}
              >
                <span className="text-[10px] font-black text-orange-300 tracking-widest uppercase">📋 이달의 보상 안내</span>
                <div className="flex-1 h-px bg-white/10" />
                <motion.span
                  className="text-[9px] font-black text-yellow-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ● LIVE
                </motion.span>
              </div>

              <div className="px-3 py-3 space-y-3">
                {/* Reward rule */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.3)' }}>
                    💎
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white leading-snug">매월 <span className="text-brand-orange">1~6위</span> 달성 시 보석 1개 획득</p>
                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5">순위는 해당 월 누적 거리 기준으로 산정됩니다</p>
                  </div>
                </div>

                {/* Gift reward */}
                <div
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,106,0,0.08))',
                    border: '1px solid rgba(255,215,0,0.25)',
                  }}
                >
                  <motion.span
                    className="text-2xl flex-shrink-0"
                    animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    🎁
                  </motion.span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-yellow-300 leading-none">보석 6개 완성 시 선물 증정!</p>
                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5">6개월 연속 또는 누적 6회 입상</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
                      👑 LEGEND
                    </span>
                  </div>
                </div>

                {/* Tier roadmap */}
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-wider mb-1.5">티어 로드맵</p>
                  <div className="flex items-center gap-0.5">
                    {[
                      { label: 'ROOKIE', color: '#6b7280', gems: '0' },
                      { label: 'BRONZE', color: '#cd7f32', gems: '1' },
                      { label: 'SILVER', color: '#a8a9ad', gems: '3' },
                      { label: 'GOLD', color: '#ffd700', gems: '5' },
                      { label: 'LEGEND', color: '#ff6a00', gems: '6', special: true },
                    ].map((tier, i, arr) => (
                      <React.Fragment key={tier.label}>
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <div
                            className="text-[7px] font-black px-1 py-0.5 rounded text-center w-full leading-none"
                            style={{
                              color: tier.color,
                              background: `${tier.color}18`,
                              border: `1px solid ${tier.color}33`,
                              boxShadow: tier.special ? `0 0 6px ${tier.color}44` : 'none',
                            }}
                          >
                            {tier.special ? '👑' : ''}{tier.label}
                          </div>
                          <span className="text-[7px] text-gray-600 font-bold">{tier.gems}개~</span>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="w-2 h-px bg-gray-700 flex-shrink-0 mb-3" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── SEARCH ── */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="회원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 pl-9 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder-gray-600"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-3" />
            </div>
          </div>

          {/* ── MEMBER CARDS ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-3">
            {sortedMembers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-16 font-bold">검색 결과가 없습니다.</p>
            ) : (
              sortedMembers.map(({ member, records, totalStamps, isAllCleared }, cardIndex) => {
                const tier = getTier(totalStamps);
                const xpPercent = Math.round((totalStamps / 6) * 100);

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: cardIndex * 0.06, type: 'spring', stiffness: 200 }}
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      background: isAllCleared
                        ? 'linear-gradient(135deg, rgba(255,106,0,0.12) 0%, rgba(168,85,247,0.12) 100%)'
                        : 'rgba(255,255,255,0.03)',
                      border: isAllCleared
                        ? '1px solid rgba(255,106,0,0.5)'
                        : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isAllCleared
                        ? '0 0 20px rgba(255,106,0,0.2), inset 0 0 20px rgba(255,106,0,0.05)'
                        : 'none',
                    }}
                  >
                    {/* Legend particles */}
                    {isAllCleared && <LegendParticles />}

                    <div className="p-4 relative z-10">
                      {/* ── Top row: name + tier badge ── */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            {member.nickname ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-sm font-black text-white">{member.nickname}</span>
                                <span className="text-[10px] text-gray-500 font-bold">({member.name})</span>
                              </div>
                            ) : (
                              <span className="text-sm font-black text-white">{member.name}</span>
                            )}
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black flex-shrink-0 ${member.gender === 'M' ? 'bg-blue-500/15 text-blue-400' : 'bg-pink-500/15 text-pink-400'}`}>
                            {member.gender}
                          </span>
                        </div>

                        {/* Tier Badge */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <motion.div
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider ${tier.textColor}`}
                            style={{
                              background: `linear-gradient(135deg, ${tier.color}22, ${tier.color}11)`,
                              border: `1px solid ${tier.color}44`,
                              boxShadow: isAllCleared ? `0 0 8px ${tier.color}44` : 'none',
                            }}
                            animate={isAllCleared ? { boxShadow: [`0 0 8px ${tier.color}44`, `0 0 16px ${tier.color}77`, `0 0 8px ${tier.color}44`] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {isAllCleared ? '👑 ' : ''}{tier.label}
                          </motion.div>
                        </div>
                      </div>

                      {/* ── Gem slots ── */}
                      <div className="grid grid-cols-6 gap-1.5 mb-3">
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const record = records[idx];
                          const isActive = !!record;
                          const monthLabel = record ? `${record.year_month.substring(5, 7)}월` : undefined;
                          return (
                            <motion.div
                              key={idx}
                              initial={isActive ? { scale: 0, rotate: -180 } : {}}
                              animate={isActive ? { scale: 1, rotate: 0 } : {}}
                              transition={{ delay: cardIndex * 0.06 + idx * 0.08, type: 'spring', stiffness: 300 }}
                            >
                              <GemIcon active={isActive} index={idx} monthLabel={monthLabel} />
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* ── XP Bar ── */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-gray-500 tracking-wider uppercase flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            보석 수집
                          </span>
                          <span className="text-[9px] font-black text-gray-400">
                            {totalStamps} <span className="text-gray-600">/ 6</span>
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.07)' }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: isAllCleared
                                ? 'linear-gradient(90deg, #ff6a00, #ffd700, #ec4899)'
                                : `linear-gradient(90deg, ${tier.color}cc, ${tier.color})`,
                              boxShadow: `0 0 6px ${tier.color}88`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ delay: cardIndex * 0.06 + 0.3, duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* ── 달성 이력 ── */}
                      {records.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-[9px] text-gray-600 font-bold leading-relaxed">
                            {records.slice(0, 6).map((r, i, arr) => (
                              <span key={r.id}>
                                <span className="text-gray-500">{r.year_month.substring(5, 7)}월</span>
                                <span className="text-gray-600"> {r.rank}위 ({r.distance.toFixed(1)}km)</span>
                                {i < arr.length - 1 ? <span className="text-gray-700"> · </span> : ''}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
