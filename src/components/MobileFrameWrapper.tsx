import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Code2, Wifi, Battery, Signal, Sparkles } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onOpenFlutterCode: () => void;
}

export const MobileFrameWrapper: React.FC<Props> = ({ children, onOpenFlutterCode }) => {
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [deviceType, setDeviceType] = useState<'iphone' | 'android'>('iphone');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#181825] text-slate-100 flex flex-col items-center justify-between">
      
      {/* Top Floating Flutter Control Panel Bar */}
      <header className="w-full bg-[#11111B]/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-sky-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Flutter Engine Mobile Prototype
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            플러터(Flutter / Dart) 네이티브 모바일 뷰어
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center text-xs">
            <button
              onClick={() => setIsMobileFrame(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                isMobileFrame
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>모바일 프레임</span>
            </button>
            <button
              onClick={() => setIsMobileFrame(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                !isMobileFrame
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>전체화면</span>
            </button>
          </div>

          {/* Device Model Switcher (only when in Mobile Frame mode) */}
          {isMobileFrame && (
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as 'iphone' | 'android')}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="iphone">iPhone 16 Pro (iOS)</option>
              <option value="android">Galaxy S24 (Android)</option>
            </select>
          )}

          {/* View Source Code Button */}
          <button
            onClick={onOpenFlutterCode}
            className="px-3.5 py-1.5 text-xs font-medium bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Dart/Flutter 소스코드</span>
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-6 my-auto">
        {isMobileFrame ? (
          <div className="relative group transition-all duration-300">
            {/* Realistic Phone Case Outer Body Frame */}
            <div
              className={`relative bg-[#0F0F17] p-3 sm:p-4 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[5px] ${
                deviceType === 'iphone' ? 'border-slate-700/80' : 'border-slate-800'
              } w-full max-w-[410px] mx-auto overflow-hidden`}
            >
              {/* Phone Hardware Side Buttons Effect */}
              <div className="absolute -left-[9px] top-28 w-[4px] h-12 bg-slate-700 rounded-l-md"></div>
              <div className="absolute -left-[9px] top-44 w-[4px] h-12 bg-slate-700 rounded-l-md"></div>
              <div className="absolute -right-[9px] top-32 w-[4px] h-16 bg-slate-700 rounded-r-md"></div>

              {/* Screen Inner Display Frame */}
              <div className="relative bg-[#FDF8F0] text-[#3D2C1E] rounded-[38px] overflow-hidden flex flex-col h-[780px] w-full shadow-inner border border-black/10">
                
                {/* Phone Top Status Bar Header */}
                <div className="bg-[#FDF8F0] text-[#3D2C1E] px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold select-none z-30 shrink-0">
                  <span>{currentTime || '09:41'}</span>

                  {/* iPhone Dynamic Island notch or Android Camera */}
                  {deviceType === 'iphone' ? (
                    <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#11111D]"></div>
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 bg-black rounded-full shadow-sm"></div>
                  )}

                  <div className="flex items-center gap-1.5 opacity-80">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Live App Content Area */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                  {children}
                </div>

                {/* iPhone Bottom Home Indicator Line */}
                <div className="bg-[#FDF8F0] py-1.5 flex justify-center shrink-0 z-30">
                  <div className="w-32 h-1 bg-[#3D2C1E]/20 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="mt-3 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Flutter UI / Mobile Frame Preview</span>
            </div>
          </div>
        ) : (
          /* Fullscreen Responsive Container */
          <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#FDF8F0]">
            {children}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-500 border-t border-slate-900 bg-[#11111B]">
        Fluffy Days (플러피 데이즈) · Flutter Cross-Platform App Architecture
      </footer>
    </div>
  );
};
