import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Dog } from 'lucide-react';
import mocaImg from '../assets/images/moca_pet_avatar_1785058401579.jpg';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF2E8] via-[#FDF8F0] to-[#F2E5D5] text-[#3D2C1E] p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-amber-50 p-1"
          >
            <img
              src={mocaImg}
              alt="Fluffy Days"
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -bottom-2 -right-2 bg-[#8B5E3C] text-white p-2.5 rounded-full shadow-lg border-2 border-white"
          >
            <Heart className="w-5 h-5 fill-rose-300 text-rose-300" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Companion & Pixel Studio
          </span>
          <h1 className="text-3xl font-black text-[#3D2C1E] tracking-tight mb-1">
            Fluffy Days
          </h1>
          <p className="text-xs text-[#8B5E3C] font-extrabold tracking-wider uppercase mb-2">
            플러피 데이즈
          </p>
          <p className="text-[#7C6350] text-xs leading-relaxed mb-6">
            소중한 내 아이와 교감하는 토탈 라이프케어<br />
            실시간 8-Bit 픽셀 펫 스튜디오 & 스마트케어
          </p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFinish}
          className="w-full py-4 px-8 bg-[#8B5E3C] hover:bg-[#724B2F] text-white font-bold rounded-2xl shadow-lg shadow-[#8B5E3C]/25 flex items-center justify-center gap-2 text-base transition-colors"
        >
          <Dog className="w-5 h-5" /> 플러피 데이즈 시작하기
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
