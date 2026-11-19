import React, { useState } from 'react';
import { PetProfile, ThemeOption, RecordItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Footprints, Calendar, ShieldAlert, ChevronRight, Activity, Smile, RefreshCw, Gamepad2, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HomeTabProps {
  pet: PetProfile;
  theme: ThemeOption;
  records: RecordItem[];
  onPetTouch: () => void;
  onNavigateToTab: (tab: 'records' | 'walk' | 'community') => void;
  onOpenAIModal: () => void;
  onOpenPixelModal: () => void;
  soundEnabled: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  pet,
  theme,
  records,
  onPetTouch,
  onNavigateToTab,
  onOpenAIModal,
  onOpenPixelModal,
  soundEnabled,
}) => {
  const [activeWidgetIdx, setActiveWidgetIdx] = useState(0);
  const [speechText, setSpeechText] = useState('오늘도 나랑 꼭 산책 가자멍! 🐾');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const speechQuotes = [
    '기분 최고다멍! 쓰다듬어줘서 고마워 💕',
    '오늘 날씨 너무 좋은데 산책 가자멍! 🌳',
    '간식 하나만 주면 완전 말 잘 들을게! 🍖',
    '주인이 최고로 좋아멍! 히히 🥰',
    '오늘 배도 부르고 행복해멍! 🐶',
  ];

  const handleCharacterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Confetti Heart Burst
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) / window.innerWidth;
    const y = (e.clientY || rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 22,
      spread: 60,
      origin: { x, y },
      colors: ['#FF5E7E', '#FF8EA3', '#8B5E3C', '#FFD166'],
      shapes: ['star', 'circle'],
      scalar: 0.9,
    });

    // Sound effect if enabled
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (err) {
        // audio play fallback
      }
    }

    // Add floating heart
    const newHeart = { id: Date.now(), x: Math.random() * 60 - 30, y: Math.random() * -20 };
    setFloatingHearts((prev) => [...prev.slice(-5), newHeart]);

    // Pick random speech
    const randomQuote = speechQuotes[Math.floor(Math.random() * speechQuotes.length)];
    setSpeechText(randomQuote);

    // Call parent handler to boost happiness
    onPetTouch();
  };

  const nextMedication = records.find((r) => r.category === 'medication' && !r.completed) || records[3];

  return (
    <div className={`min-h-screen pb-28 pt-4 px-4 bg-gradient-to-b ${theme.bgGradient} transition-colors duration-500`}>
      <div className="max-w-md mx-auto space-y-5">
        
        {/* Status Header Banner */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-xs border border-stone-200/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-stone-700">모카토토 AI 라이브 연결됨</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span>오늘 기분:</span>
            <span className="font-bold text-[#8B5E3C] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              최상 🌟
            </span>
          </div>
        </div>

        {/* Central Breathing Interactive Pet Avatar */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-4">
          
          {/* Ambient Theme Glow Background */}
          <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-amber-200/40 via-rose-100/30 to-emerald-100/30 blur-2xl -z-10 animate-pulse" />

          {/* Interactive Speech Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={speechText}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="relative mb-3 px-4 py-2.5 rounded-2xl bg-white/95 shadow-md border border-amber-200 text-[#3D2C1E] text-xs font-extrabold max-w-xs text-center flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>"{speechText}"</span>
              {/* Bubble tail */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-amber-200" />
            </motion.div>
          </AnimatePresence>

          {/* Breathing Animated Character */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCharacterClick}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.015, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.2,
              ease: 'easeInOut',
            }}
            className="relative cursor-pointer group select-none"
          >
            {/* Avatar Frame */}
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full p-2 bg-gradient-to-br from-white via-amber-100 to-amber-200 shadow-xl border-4 border-white/80 relative overflow-hidden">
              <img
                src={pet.avatarUrl}
                alt={pet.name}
                className="w-full h-full object-cover rounded-full pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Touch Overlay Indicator */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                <span className="bg-white/90 text-[#8B5E3C] px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> 살짝 터치해보세요!
                </span>
              </div>
            </div>

            {/* Happiness Level Floating Badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-2 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-rose-200 flex items-center gap-2 text-xs font-extrabold text-stone-800"
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-bounce" />
              <span>행복도 {pet.happiness}%</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
                +1 Touch!
              </span>
            </motion.div>

            {/* Flying Hearts Effects */}
            {floatingHearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 1, y: 0, x: h.x, scale: 0.8 }}
                animate={{ opacity: 0, y: -80, scale: 1.4 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 pointer-events-none z-20 text-rose-500 font-bold flex items-center gap-1"
              >
                <Heart className="w-6 h-6 fill-rose-500" />
                <span className="text-xs bg-white/90 px-1.5 py-0.5 rounded-full text-rose-600 shadow-xs">
                  +1 ❤️
                </span>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onOpenPixelModal}
              className="py-2 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Gamepad2 className="w-4 h-4 text-[#8B5E3C]" />
              <span>8-Bit 픽셀 캐릭터 만들기</span>
              <span className="bg-[#8B5E3C] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                NEW
              </span>
            </button>
          </div>

          <p className="text-[11px] text-stone-500 mt-2 font-medium flex items-center gap-1">
            <span>🐾 클릭할 때마다 행복도가 오르고 기분이 표현됩니다</span>
          </p>
        </div>

        {/* Featured Pixel Pet Studio Banner */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={onOpenPixelModal}
          className="cursor-pointer bg-gradient-to-r from-[#2D1B0E] via-[#3E2514] to-[#4A2E19] text-white rounded-3xl p-4 shadow-md border-2 border-amber-400/40 relative overflow-hidden flex items-center justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-amber-400 text-stone-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                카메라 / 8-Bit
              </span>
              <span className="text-amber-200 text-xs font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Fluffy Days 픽셀 스튜디오
              </span>
            </div>
            <h4 className="text-sm font-black text-white tracking-tight">
              {pet.name}의 사진 찍고 레트로 도트 캐릭터 생성!
            </h4>
            <p className="text-[11px] text-stone-300 mt-0.5 truncate">
              실시간 16/32px 해상도 조절, 게임보이 컬러 팔레트 & RPG 스탯 분석
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0 text-amber-300 shadow-inner">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
        </motion.div>

        {/* Happiness Meter Progress Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-stone-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-stone-700 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-500" /> {pet.name}의 케어 지수
            </span>
            <span className="text-[#8B5E3C]">{pet.happiness} / 100 점</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-[#8B5E3C] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pet.happiness}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[11px] text-stone-500 text-right">
            오늘 요구된 영양 및 산책 스케줄 85% 달성 중!
          </p>
        </div>

        {/* Swipeable / Tabbed Summary Widgets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#8B5E3C]" /> 오늘의 요약 카드
            </h3>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setActiveWidgetIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeWidgetIdx === i ? 'w-5 bg-[#8B5E3C]' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait">
              {activeWidgetIdx === 0 && (
                <motion.div
                  key="widget-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/95 rounded-3xl p-4 shadow-sm border border-stone-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-emerald-600" /> 오늘 일일 종합 활동
                    </span>
                    <button
                      onClick={() => onNavigateToTab('walk')}
                      className="text-[11px] font-bold text-[#8B5E3C] hover:underline flex items-center gap-0.5"
                    >
                      산책 기록보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-700 font-bold">산책 시간</p>
                      <p className="text-sm font-extrabold text-emerald-900 mt-0.5">28분 🐾</p>
                    </div>
                    <div className="bg-amber-50/80 p-2.5 rounded-2xl border border-amber-100">
                      <p className="text-[10px] text-amber-700 font-bold">사료 급여</p>
                      <p className="text-sm font-extrabold text-amber-900 mt-0.5">60g 완료</p>
                    </div>
                    <div className="bg-sky-50/80 p-2.5 rounded-2xl border border-sky-100">
                      <p className="text-[10px] text-sky-700 font-bold">음수량</p>
                      <p className="text-sm font-extrabold text-sky-900 mt-0.5">180ml</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeWidgetIdx === 1 && (
                <motion.div
                  key="widget-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/95 rounded-3xl p-4 shadow-sm border border-amber-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" /> 다음 예정 일정
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                      D-Day 오늘
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
                    <div>
                      <p className="text-xs font-extrabold text-stone-800">{nextMedication?.title || '심장사상충 약 복용'}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{nextMedication?.detail || '하트가드 1정 복용'}</p>
                    </div>
                    <button
                      onClick={() => onNavigateToTab('records')}
                      className="px-3 py-1.5 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      완료 체크
                    </button>
                  </div>
                </motion.div>
              )}

              {activeWidgetIdx === 2 && (
                <motion.div
                  key="widget-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 rounded-3xl p-4 shadow-sm border border-amber-300/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Gemini 멀티모달 AI 닥터
                    </span>
                    <button
                      onClick={onOpenAIModal}
                      className="text-[11px] font-bold text-[#8B5E3C] hover:underline flex items-center gap-0.5"
                    >
                      사진 진단 & 상담 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-800 font-medium leading-relaxed">
                    "이상 변, 피부 상처, 사료 성분표 사진을 찍어 올리면 수의학 AI가 실시간으로 분석해드립니다!"
                  </p>
                  <div className="flex gap-1.5 pt-0.5">
                    <span className="text-[10px] bg-white/90 text-stone-700 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                      💩 대변 형태 판별
                    </span>
                    <span className="text-[10px] bg-white/90 text-stone-700 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                      🩺 피부 발진 검진
                    </span>
                    <span className="text-[10px] bg-white/90 text-stone-700 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                      🥣 사료 영양 분석
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Access Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigateToTab('walk')}
            className="p-3.5 bg-[#8B5E3C] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#8B5E3C]/20 transition-all hover:bg-[#724B2F]"
          >
            <Footprints className="w-4 h-4" /> 산책 시작 & Shapeify 🐾
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigateToTab('community')}
            className="p-3.5 bg-white text-stone-800 border border-stone-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-stone-50 transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" /> 주변 병원 & 카페 📍
          </motion.button>
        </div>

      </div>
    </div>
  );
};
