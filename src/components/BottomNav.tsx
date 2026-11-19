import React from 'react';
import { TabType } from '../types';
import { Home, FileText, Footprints, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabType, label: '홈', icon: Home },
    { id: 'records' as TabType, label: '기록', icon: FileText },
    { id: 'walk' as TabType, label: '산책', icon: Footprints, highlight: true },
    { id: 'community' as TabType, label: '커뮤니티', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-stone-200/80 px-4 py-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center py-1 px-3 min-w-[64px] focus:outline-none group"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomTabIndicator"
                  className="absolute -top-2 w-8 h-1 bg-[#8B5E3C] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#8B5E3C] bg-[#8B5E3C]/10 font-bold'
                    : 'text-stone-400 group-hover:text-stone-600'
                } ${tab.highlight && !isActive ? 'text-[#8B5E3C]' : ''}`}
              >
                <Icon className={`w-5 h-5 ${tab.highlight && isActive ? 'stroke-[2.5px]' : ''}`} />
              </motion.div>

              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'font-extrabold text-[#8B5E3C]' : 'font-medium text-stone-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
