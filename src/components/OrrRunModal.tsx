import React from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface OrrRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number | string;
  settings?: {
    distance?: string;
    description?: string;
    meeting_point?: string;
    time?: string;
  };
}

const ROUTE_DATA: Record<string, { 
  title: string; 
  description: string; 
  distance: string; 
  meetingPoint: string; 
  time: string; 
  mapUrl?: string;
  headerText?: string;
  headerSvgPath?: string;
  headerSvgViewBox?: string;
}> = {
  '1': {
    title: '시민공원 런닝',
    description: '시원한 바람맞으며 땀 흘리는 상쾌함, 같이 느껴봐요.',
    distance: '5km',
    meetingPoint: '시민공원 남1문 앞',
    time: '오전 10시 00분',
    headerText: 'Citizens Park',
    headerSvgViewBox: '0 0 302 245',
    headerSvgPath: 'M212.845 2.09377L206.217 9.2878L195.17 15.2828L185.596 24.2754L167.185 50.054L158.347 57.8475L145.828 68.039L128.153 78.8301L98.6947 93.2182L69.2366 102.81L45.6701 108.805L36.8327 113.002L29.4681 116.599L11.7933 120.196L1.48291 125.591L6.63808 132.785L11.7933 140.579L16.212 150.171L23.5765 163.36L36.0962 189.139L43.4607 201.129L53.0346 216.116L60.3992 225.708L67.7637 234.101L77.3376 243.094L87.6479 234.101L95.0125 225.109L102.377 220.912L120.788 216.116L123.734 225.109L128.153 234.101H139.2V222.111L153.929 216.116L168.658 210.121L187.069 202.927L209.163 193.935L216.527 196.932L223.892 207.124L229.783 219.114L238.621 225.109L247.458 232.902L260.714 225.109L251.877 217.315L242.303 210.121L231.256 201.129L227.574 193.335L229.783 186.141L242.303 180.146L260.714 172.952L299.01 159.163L300.483 150.171L290.173 141.178L273.971 126.191L260.714 108.206L249.668 87.2231L238.621 66.2405L227.574 45.258L220.21 27.2729L215.054 12.2853L212.845 2.09377Z'
  },
  '2': {
    title: '남산 업힐 챌린지',
    description: '남산 서울타워까지 이어지는 오르막 코스입니다. 심폐지구력 향상에 좋으며, 정상에서의 야경이 일품입니다.',
    distance: '7km',
    meetingPoint: '동대입구역 6번 출구',
    time: '오전 7시 30분',
  },
};

export const OrrRunModal: React.FC<OrrRunModalProps> = ({ isOpen, onClose, routeId, settings }) => {
  if (!isOpen) return null;

  const baseData = ROUTE_DATA[routeId.toString()] || ROUTE_DATA['1'];
  const data = {
    ...baseData,
    distance: settings?.distance || baseData.distance,
    description: settings?.description || baseData.description,
    meetingPoint: settings?.meeting_point || baseData.meetingPoint,
    time: settings?.time || baseData.time,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header Image Area */}
        <div className="h-36 bg-neutral-50 border-b border-neutral-200 relative flex items-center justify-center overflow-hidden">
          {data.headerSvgPath && (
            <motion.svg
              viewBox={data.headerSvgViewBox || "0 0 300 300"}
              className="absolute inset-0 w-full h-full p-2 scale-110"
              preserveAspectRatio="xMidYMid meet"
              initial="hidden"
              animate="visible"
            >
              <motion.path
                d={data.headerSvgPath}
                stroke="#FF5500"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.svg>
          )}
          
          <h2 className="text-4xl font-bold text-neutral-900 z-10 drop-shadow-sm tracking-tight">
            {data.headerText || 'orr run'}
          </h2>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-200/50 hover:bg-neutral-200 rounded-full transition-colors z-20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full">
              코스 안내
            </span>
            <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full">
              {data.distance}
            </span>
          </div>
          
          <h3 className="mb-2 text-2xl font-bold text-gray-900">
            {data.title}
          </h3>
          <p className="mb-4 text-gray-600 leading-relaxed text-sm">
            {data.description}
          </p>

          <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 text-neutral-600">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">집결지</p>
                <p className="font-semibold text-neutral-900">{data.meetingPoint}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-neutral-600">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">출발 시간</p>
                <p className="font-semibold text-neutral-900">{data.time}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-orange-500/20"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
