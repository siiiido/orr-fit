import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OrrRunModal } from './OrrRunModal';
import classNames from 'classnames';

interface OrrRunSettings {
  date: string;
  d_day: number;
  route_modal_id: string | number;
  enabled: boolean;
}

export const OrrRunBanner: React.FC = () => {
  const [settings, setSettings] = useState<OrrRunSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  
  // For text animation cycling
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'next_orr_run')
        .single();

      if (error || !data) return;

      const parsedSettings = data.value as OrrRunSettings;
      setSettings(parsedSettings);

      if (parsedSettings.enabled && parsedSettings.date) {
        // Calculate KST or local D-Day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDate = new Date(parsedSettings.date);
        eventDate.setHours(0, 0, 0, 0);

        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= parsedSettings.d_day) {
          setDaysLeft(diffDays);
          setIsVisible(true);
        }
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % 3);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !settings) return null;

  const texts = [
    '🏃 orr run',
    `D-${daysLeft === 0 ? 'Day' : daysLeft}`,
    'Click me!'
  ];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={classNames(
          "fixed bottom-6 right-6 z-40 px-6 py-3 rounded-full shadow-xl shadow-indigo-500/30",
          "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black italic tracking-tighter text-lg",
          "transition-all duration-300 hover:scale-105 active:scale-95",
          "w-36 flex items-center justify-center overflow-hidden"
        )}
      >
        {/* Animated text container */}
        <div className="relative w-full h-7">
          {texts.map((text, idx) => (
            <span
              key={idx}
              className={classNames(
                "absolute inset-0 flex items-center justify-center transition-all duration-500",
                textIndex === idx 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4"
              )}
            >
              {text}
            </span>
          ))}
        </div>
      </button>

      <OrrRunModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        routeId={settings.route_modal_id}
      />
    </>
  );
};
