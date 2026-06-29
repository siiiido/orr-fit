import { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { Header } from './components/Header';

function App() {
  const { members, runs, monthlyTarget, isLoading } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGate, setShowGate] = useState(false);

  // Compute metrics
  const totalDistance = runs.reduce((acc, r) => acc + r.distance, 0);
  const activeCount = members.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-400">데이터를 실시간 동기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darkBg pb-12 transition-all duration-300">
      <Header
        totalDistance={totalDistance}
        activeCount={activeCount}
        isAdmin={isAdmin}
        onAdminToggle={() => (isAdmin ? setIsAdmin(false) : setShowGate(true))}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-8 space-y-6">
        {/* Admin panel placeholder if logged in */}
        {isAdmin && (
          <div className="bg-brand-darkSurface border border-red-500/20 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-red-500 mb-2">관리자 모드 활성화됨</h3>
            <p className="text-xs text-gray-400">관리자 패널 컴포넌트가 구현되면 여기에 표시됩니다.</p>
          </div>
        )}

        {/* Three-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Stats & Target (Span 3) */}
          <div className="lg:col-span-3 bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2">월간 목표 & 진행도</h3>
            <p className="text-xs text-gray-400">GoalProgress 컴포넌트가 위치할 곳입니다.</p>
            <div className="mt-4 text-2xl font-black text-brand-orange">
              {totalDistance.toFixed(1)} / {monthlyTarget} km
            </div>
          </div>

          {/* Column 2: Hall of Fame & Leaderboard (Span 6) */}
          <div className="lg:col-span-6 bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2">명예의 전당 (리더보드)</h3>
            <p className="text-xs text-gray-400">Leaderboard 컴포넌트가 위치할 곳입니다.</p>
            <div className="mt-4 space-y-2">
              {members.slice(0, 5).map((m, idx) => (
                <div key={m.id} className="flex justify-between text-sm py-1 border-b border-gray-800/50">
                  <span>{idx + 1}. {m.name}</span>
                  <span className="font-bold text-white">{m.gender}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Recent Activity (Span 3) */}
          <div className="lg:col-span-3 bg-brand-darkSurface border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-2">최근 활동기록</h3>
            <p className="text-xs text-gray-400">RecentActivity 컴포넌트가 위치할 곳입니다.</p>
            <div className="mt-4 text-sm text-gray-400">
              최근 러닝 기록 {runs.length}건이 동기화되었습니다.
            </div>
          </div>
        </div>
      </main>

      {/* Password Gate Modal Overlay (Inline mockup for Task 4) */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-brand-darkSurface border border-brand-orange/10 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">관리자 인증</h3>
            <p className="text-xs text-gray-400 mb-4">비밀번호를 입력하여 관리자 모드로 전환합니다. (임시: 아무 값 입력 또는 확인 클릭)</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowGate(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  setIsAdmin(true);
                  setShowGate(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-brand-orange text-white rounded-lg hover:bg-brand-orange/95 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
