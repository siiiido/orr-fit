import React from 'react';
import { X, MapPin, Clock } from 'lucide-react';

interface OrrRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number | string;
}

const ROUTE_DATA: Record<string, { title: string; description: string; distance: string; meetingPoint: string; time: string; mapUrl?: string }> = {
  '1': {
    title: '한강 야간 러닝 코스',
    description: '시원한 강바람을 맞으며 달리는 한강공원 왕복 코스입니다. 초보자도 쉽게 뛸 수 있는 평탄한 길입니다.',
    distance: '5km',
    meetingPoint: '여의나루역 2번 출구 앞',
    time: '오후 8시 00분',
  },
  '2': {
    title: '남산 업힐 챌린지',
    description: '남산 서울타워까지 이어지는 오르막 코스입니다. 심폐지구력 향상에 좋으며, 정상에서의 야경이 일품입니다.',
    distance: '7km',
    meetingPoint: '동대입구역 6번 출구',
    time: '오전 7시 30분',
  },
};

export const OrrRunModal: React.FC<OrrRunModalProps> = ({ isOpen, onClose, routeId }) => {
  if (!isOpen) return null;

  const data = ROUTE_DATA[routeId.toString()] || ROUTE_DATA['1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header Image Area */}
        <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md z-10">
            orr run
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
              코스 안내
            </span>
            <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300">
              {data.distance}
            </span>
          </div>
          
          <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.title}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
            {data.description}
          </p>

          <div className="space-y-4 bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">집결지</p>
                <p className="font-semibold">{data.meetingPoint}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                <Clock size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">집결 시간</p>
                <p className="font-semibold">{data.time}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-6 py-3 font-bold text-white transition-transform transform bg-black rounded-xl hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0 shadow-lg dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
