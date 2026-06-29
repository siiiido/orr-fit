import { useState } from 'react';
import { Activity, Flame, Trophy } from 'lucide-react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-brand-darkBg text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-brand-darkSurface border border-gray-800 rounded-2xl p-8 shadow-orangeGlow text-center">
        {/* Logo/Icon section */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange mb-6">
          <Flame className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
          ORR FIT
        </h1>
        <p className="text-brand-silver text-sm mb-6">
          실시간 러닝 랭킹 대시보드
        </p>

        <div className="bg-brand-darkBg/50 border border-gray-800/80 rounded-xl p-4 mb-6 flex justify-around">
          <div className="flex flex-col items-center">
            <Trophy className="w-5 h-5 text-brand-gold mb-1" />
            <span className="text-xs text-brand-silver">Rankings</span>
            <span className="text-sm font-bold text-white">Active</span>
          </div>
          <div className="w-[1px] bg-gray-800"></div>
          <div className="flex flex-col items-center">
            <Activity className="w-5 h-5 text-brand-orange mb-1" />
            <span className="text-xs text-brand-silver">Status</span>
            <span className="text-sm font-bold text-green-400">Ready</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-brand-orange/20"
        >
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
