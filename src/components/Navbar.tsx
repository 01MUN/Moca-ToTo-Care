import React from 'react';
import { PetProfile, ThemeOption, User } from '../types';
import { Heart, Sparkles, Volume2, VolumeX, Palette, ChevronDown, Users, UserCheck, LogIn, Gamepad2 } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  currentPet: PetProfile;
  pets: PetProfile[];
  onSelectPet: (pet: PetProfile) => void;
  activeTheme: ThemeOption;
  onOpenThemeModal: () => void;
  onOpenAIModal: () => void;
  onOpenPixelModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onOpenFamilyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPet,
  pets,
  onSelectPet,
  activeTheme,
  onOpenThemeModal,
  onOpenAIModal,
  onOpenPixelModal,
  soundEnabled,
  onToggleSound,
  currentUser,
  onOpenAuthModal,
  onOpenFamilyModal,
}) => {
  const [showPetDropdown, setShowPetDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 border-b border-stone-200/60 px-4 py-3 transition-colors">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        
        {/* Pet Switcher */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowPetDropdown(!showPetDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-stone-100/90 hover:bg-stone-200/70 border border-stone-200 text-left transition-colors"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white shadow-xs">
              <img
                src={currentPet.avatarUrl}
                alt={currentPet.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-stone-800">
                {currentPet.name}
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <span className="text-[10px] text-stone-500 font-medium">{currentPet.breed}</span>
            </div>
          </motion.button>

          {/* Dropdown menu */}
          {showPetDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 overflow-hidden"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                <span>반려동물 선택</span>
                <span className="text-[10px] text-stone-500 font-normal">{pets.length}마리</span>
              </div>
              {pets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPet(p);
                    setShowPetDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                    p.id === currentPet.id ? 'bg-[#8B5E3C]/10 text-[#8B5E3C] font-bold' : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-semibold">{p.name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{p.breed}</p>
                  </div>
                  {p.id === currentPet.id && <span className="text-xs">✓</span>}
                </button>
              ))}

              <div className="pt-2 mt-1 border-t border-stone-100">
                <button
                  onClick={() => {
                    setShowPetDropdown(false);
                    onOpenFamilyModal();
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>가족 공동 양육자 관리 / 초대</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* User Profile & Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* User Account / Login Button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onOpenAuthModal}
            className="p-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            title="계정 전환 및 로그인"
          >
            <div className="w-4 h-4 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-[9px] font-black">
              {currentUser ? currentUser.nickname[0] : '👤'}
            </div>
            <span className="max-w-[70px] truncate">
              {currentUser ? currentUser.nickname.split(' ')[0] : '로그인'}
            </span>
          </motion.button>

          {/* Family Sharing Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenFamilyModal}
            className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="공동 양육자 관리"
          >
            <Users className="w-4 h-4" />
          </motion.button>

          {/* Theme Selector Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenThemeModal}
            className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="배경 테마 변경"
          >
            <Palette className="w-4 h-4 text-[#8B5E3C]" />
          </motion.button>

          {/* Sound Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onToggleSound}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-stone-100 text-stone-400 border-stone-200'
            }`}
            title={soundEnabled ? '효과음 켜짐' : '효과음 끄기'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Pixel Pet Studio Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenPixelModal}
            className="py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1 shadow-2xs transition-colors"
            title="8-Bit 픽셀 펫 스튜디오"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#8B5E3C] animate-bounce" />
            <span className="hidden sm:inline">픽셀 펫</span>
          </motion.button>

          {/* AI Doctor Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenAIModal}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#8B5E3C] to-[#A06C3F] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-opacity hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">AI 닥터</span>
          </motion.button>
        </div>

      </div>
    </header>
  );
};
